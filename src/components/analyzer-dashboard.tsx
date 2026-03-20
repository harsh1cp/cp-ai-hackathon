"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Loader2,
  LogOut,
  MessageSquare,
  Presentation,
  Search,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SentimentPieChart } from "@/components/sentiment-pie-chart";
import { WorkflowPipeline } from "@/components/workflow-pipeline";
import { saveCallAudio } from "@/lib/call-audio-db";
import type { SalesCallRecord } from "@/lib/sales-call-model";
import { cn } from "@/lib/utils";

type Summary = {
  totalCalls: number;
  avgScore: number;
  avgDurationSeconds: number;
  actionItemsCount: number;
  sentimentMix: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
  };
};

type Me = {
  email: string;
  role: "MASTER" | "USER";
};

type CallRow = SalesCallRecord & { ownerEmail: string };

type SentimentFilter = "all" | "positive" | "neutral" | "negative";

type HealthFlags = {
  database: boolean;
  openai: boolean;
  blob: boolean;
};

function fileDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    const done = (n: number) => {
      URL.revokeObjectURL(url);
      resolve(n);
    };
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      done(Number.isFinite(d) && d > 0 ? d : 0);
    };
    audio.onerror = () => done(0);
  });
}

function formatDuration(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function AnalyzerDashboard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [health, setHealth] = useState<HealthFlags | null>(null);
  const [callSearchQuery, setCallSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] =
    useState<SentimentFilter>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progressLines, setProgressLines] = useState<string[]>([]);

  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of calls) {
      if (c.ownerEmail) set.add(c.ownerEmail);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [calls]);

  const filteredCalls = useMemo(() => {
    let list = calls;
    if (sentimentFilter !== "all") {
      list = list.filter((c) => c.sentiment.overall === sentimentFilter);
    }
    if (ownerFilter !== "all") {
      list = list.filter((c) => c.ownerEmail === ownerFilter);
    }
    const q = callSearchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const hay = [
        c.id,
        c.ownerEmail,
        c.fileName,
        c.transcript,
        c.summary,
        c.sentiment?.overall,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [calls, callSearchQuery, sentimentFilter, ownerFilter]);

  const recentFiltersActive =
    callSearchQuery.trim() !== "" ||
    sentimentFilter !== "all" ||
    ownerFilter !== "all";

  const clearRecentFilters = useCallback(() => {
    setCallSearchQuery("");
    setSentimentFilter("all");
    setOwnerFilter("all");
  }, []);

  const load = useCallback(async () => {
    setLoadErr(null);
    try {
      const [rMe, rSum, rCalls, rHealth] = await Promise.all([
        fetch("/api/auth/me", { credentials: "include" }),
        fetch("/api/calls/summary", { credentials: "include" }),
        fetch("/api/calls", { credentials: "include" }),
        fetch("/api/health", { credentials: "include" }),
      ]);
      if (rMe.status === 401) {
        router.replace("/login");
        return;
      }
      const jMe = (await rMe.json()) as { user: Me | null };
      if (!jMe.user) {
        router.replace("/login");
        return;
      }
      setMe(jMe.user);
      if (rSum.ok) {
        setSummary((await rSum.json()) as Summary);
      }
      if (rCalls.ok) {
        const jc = (await rCalls.json()) as { calls: CallRow[] };
        setCalls(jc.calls ?? []);
      }
      if (rHealth.ok) {
        setHealth((await rHealth.json()) as HealthFlags);
      } else {
        setHealth(null);
      }
    } catch {
      setLoadErr("Failed to load dashboard");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
    router.refresh();
  };

  const downloadCsv = async () => {
    const res = await fetch("/api/calls/export/csv", { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-calls-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPpt = () => {
    window.open("/api/export-analyzer-ppt", "_blank");
  };

  const processFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const fileArr = Array.from(files);
    setBusy(true);
    setProgressLines([]);
    const fd = new FormData();
    const durs: number[] = [];
    for (let i = 0; i < fileArr.length; i++) {
      durs.push(await fileDurationSeconds(fileArr[i]));
      fd.append("audio", fileArr[i]);
    }
    fd.set("durations", JSON.stringify(durs));

    try {
      const res = await fetch("/api/calls/process", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const dec = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const line of parts) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as Record<string, unknown>;
            if (ev.type === "progress") {
              setProgressLines((p) => [
                ...p,
                `${String(ev.step)} · ${String(ev.name ?? "")}`,
              ]);
            }
            if (ev.type === "call_saved") {
              const callId = typeof ev.callId === "string" ? ev.callId : "";
              const idx =
                typeof ev.index === "number" && ev.index >= 1
                  ? ev.index - 1
                  : -1;
              const file = idx >= 0 && idx < fileArr.length ? fileArr[idx] : null;
              if (callId && file) {
                void saveCallAudio(callId, file).catch(() => {
                  /* IndexedDB optional; server may still have file / Blob */
                });
              }
              setProgressLines((p) => [
                ...p,
                `Saved call ${String(ev.callId)} · ${String(ev.name ?? "")}`,
              ]);
            }
            if (ev.type === "error") {
              setProgressLines((p) => [
                ...p,
                `Error: ${String(ev.message ?? ev.name ?? "failed")}`,
              ]);
            }
          } catch {
            /* skip bad line */
          }
        }
      }
    } catch (e) {
      setProgressLines((p) => [
        ...p,
        e instanceof Error ? e.message : "Upload failed",
      ]);
    } finally {
      setBusy(false);
      void load();
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!me) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const agg = summary ?? {
    totalCalls: 0,
    avgScore: 0,
    avgDurationSeconds: 0,
    actionItemsCount: 0,
    sentimentMix: { positivePct: 0, neutralPct: 0, negativePct: 0 },
  };

  const recentListMeta =
    calls.length === 0
      ? null
      : recentFiltersActive
        ? `Showing ${Math.min(20, filteredCalls.length)} of ${filteredCalls.length} after filters · ${calls.length} total`
        : `Showing ${Math.min(20, filteredCalls.length)} of ${calls.length} calls`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-amber-50/40 dark:from-stone-950 dark:via-background dark:to-stone-900/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              CP Prompt-X · Sales Call Analyzer
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Main dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{me.email}</span>{" "}
              ({me.role === "MASTER" ? "Master — all team calls" : "Rep — own calls only"})
            </p>
            {loadErr ? (
              <p className="mt-2 text-sm text-destructive">{loadErr}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/dashboard">Home</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/docs/management-brief">
                <FileText className="h-4 w-4" />
                Brief
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/chat">
                <MessageSquare className="h-4 w-4" />
                Sales chat
              </Link>
            </Button>
            <Button variant="secondary" size="sm" className="gap-2" onClick={downloadCsv}>
              <FileSpreadsheet className="h-4 w-4" />
              CSV export
            </Button>
            <Button variant="secondary" size="sm" className="gap-2" onClick={downloadPpt}>
              <Presentation className="h-4 w-4" />
              PPT submission
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total calls</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{agg.totalCalls}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {me.role === "MASTER" ? "All reps under this master account." : "Your uploaded calls."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg score (0–10)</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {agg.totalCalls ? agg.avgScore : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              AI quality rubric across visible calls.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg duration</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {agg.totalCalls ? formatDuration(agg.avgDurationSeconds) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Stored duration per recording.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Action items</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{agg.actionItemsCount}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Total extracted follow-ups.
            </CardContent>
          </Card>
        </div>

        {health ? (
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Integration readiness
              </CardTitle>
              <CardDescription className="text-xs">
                Session-only diagnostics: database connectivity and whether optional env keys are
                set (never exposed). Local audio under{" "}
                <code className="rounded bg-muted px-1">uploads/calls</code> can work without Blob.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 pb-4 pt-0">
              <StatusPill ok={health.database} label="Database" />
              <StatusPill ok={health.openai} label="OpenAI" />
              <StatusPill ok={health.blob} label="Vercel Blob" />
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Aggregate sentiment
              </CardTitle>
              <CardDescription>Average mix across visible calls.</CardDescription>
            </CardHeader>
            <CardContent>
              {agg.totalCalls > 0 ? (
                <SentimentPieChart
                  positivePct={agg.sentimentMix.positivePct}
                  neutralPct={agg.sentimentMix.neutralPct}
                  negativePct={agg.sentimentMix.negativePct}
                />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Upload calls to populate the chart.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">From upload to insight</CardTitle>
              <CardDescription>
                Four steps — same pipeline, clearer layout on every screen size.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <WorkflowPipeline />
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" />
                Multi-call upload
              </CardTitle>
              <CardDescription>
                Real-time progress (NDJSON stream). One Whisper + analysis per file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,video/*,.mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga,.mov"
                multiple
                className="hidden"
                disabled={busy}
                onChange={(e) => void processFiles(e.target.files)}
              />
              <Button
                disabled={busy}
                className="w-full gap-2"
                onClick={() => fileRef.current?.click()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {busy ? "Processing…" : "Choose multiple audio files"}
              </Button>
              {progressLines.length > 0 ? (
                <ScrollBox lines={progressLines} />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-base">Recent calls</CardTitle>
                <CardDescription>Open any row for full dashboards.</CardDescription>
              </div>
              {calls.length > 0 ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end lg:max-w-3xl lg:justify-end">
                  <Select
                    value={sentimentFilter}
                    onValueChange={(v) =>
                      setSentimentFilter(v as SentimentFilter)
                    }
                  >
                    <SelectTrigger
                      className="h-9 w-full sm:w-[158px]"
                      aria-label="Filter by sentiment"
                    >
                      <SelectValue placeholder="Sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sentiments</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                  {me.role === "MASTER" ? (
                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                      <SelectTrigger
                        className="h-9 w-full sm:min-w-[200px] sm:max-w-[260px]"
                        aria-label="Filter by user"
                      >
                        <SelectValue placeholder="User" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        {ownerOptions.map((email) => (
                          <SelectItem key={email} value={email}>
                            {email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search ID, rep, file, transcript…"
                      value={callSearchQuery}
                      onChange={(e) => setCallSearchQuery(e.target.value)}
                      className="pl-9"
                      aria-label="Search recent calls"
                    />
                  </div>
                  {recentFiltersActive ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 shrink-0 text-muted-foreground"
                      onClick={clearRecentFilters}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {recentListMeta ? (
              <p className="text-xs text-muted-foreground">{recentListMeta}</p>
            ) : null}
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No calls yet.</p>
            ) : filteredCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No calls match your filters or search.
              </p>
            ) : (
              <div
                className="max-h-[min(26rem,50vh)] overflow-y-auto overscroll-y-contain rounded-lg border"
                role="region"
                aria-label="Recent calls list"
              >
                <ul className="divide-y">
                  {filteredCalls.slice(0, 20).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/call/${c.id}`}
                        className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-primary">
                            {c.overallScore.toFixed(1)} · {c.sentiment.overall}
                            {me.role === "MASTER" ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                ({c.ownerEmail})
                              </span>
                            ) : null}
                          </div>
                          <div
                            className="mt-0.5 truncate text-xs text-muted-foreground"
                            title={c.fileName ?? undefined}
                          >
                            <span className="text-muted-foreground/80">File:</span>{" "}
                            {c.fileName?.trim()
                              ? c.fileName
                              : "—"}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()} ·{" "}
                          {formatDuration(c.durationSeconds)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScrollBox({ lines }: { lines: string[] }) {
  return (
    <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
      {lines.slice(-40).map((l, i) => (
        <div key={`${i}-${l}`}>{l}</div>
      ))}
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
          : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          ok ? "bg-emerald-600 dark:bg-emerald-400" : "bg-amber-600 dark:bg-amber-400",
        )}
        aria-hidden
      />
      {label}
      <span className="sr-only">{ok ? "OK" : "Not configured or unreachable"}</span>
    </span>
  );
}
