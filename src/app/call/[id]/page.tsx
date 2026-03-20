"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Circle,
  Headphones,
  Loader2,
  MessageCircle,
  UserRound,
  Video,
} from "lucide-react";
import { AgentRadarChart } from "@/components/agent-radar-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TalkTimePie } from "@/components/talk-time-pie";
import { SentimentPieChart } from "@/components/sentiment-pie-chart";
import { getCallAudio } from "@/lib/call-audio-db";
import {
  QUESTIONNAIRE_LABELS,
  type SalesCallRecord,
} from "@/lib/sales-call-model";
import { cn } from "@/lib/utils";

type CallDetail = SalesCallRecord & {
  audioUrl?: string | null;
  ownerEmail?: string;
};

const FOLLOW_UP_LABELS: Record<
  keyof SalesCallRecord["followUpActions"],
  string
> = {
  sendQuote: "Send quote",
  shareDesigns: "Share catalog",
  scheduleConsult: "Schedule consult",
  reviewCompetitorQuote: "Review competitor quote",
};

const TOPIC_THRESHOLD = 35;

function isVideoMimeType(mime: string): boolean {
  return mime.trim().toLowerCase().startsWith("video/");
}

export default function CallDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMissing, setAudioMissing] = useState(false);
  const [activeSeg, setActiveSeg] = useState<number>(-1);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/calls/${id}`, { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 404) {
          if (!cancelled) {
            setCall(null);
            setErr("notfound");
          }
          return;
        }
        if (!res.ok) throw new Error("Failed to load call");
        const data = (await res.json()) as { call: CallDetail };
        if (cancelled) return;
        setCall(data.call);
      } catch {
        if (!cancelled) setErr("load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    if (!call) return;

    const raw = (call.audioUrl ?? "").trim();
    setAudioMissing(false);

    // Public Blob/CDN URLs — <audio> can load without our fetch
    if (raw && /^https?:\/\//i.test(raw)) {
      setAudioUrl(raw);
      return () => {};
    }

    setAudioUrl(null);

    (async () => {
      if (raw.startsWith("/api/")) {
        try {
          const res = await fetch(raw, { credentials: "include" });
          if (cancelled) return;
          if (!res.ok) {
            setAudioMissing(true);
            return;
          }
          const blob = await res.blob();
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setAudioUrl(objectUrl);
          setAudioMissing(false);
        } catch {
          if (!cancelled) setAudioMissing(true);
        }
        return;
      }

      if (raw) {
        if (!cancelled) setAudioUrl(raw);
        return;
      }

      const blob = await getCallAudio(id);
      if (cancelled) return;
      if (!blob) {
        setAudioMissing(true);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setAudioUrl(objectUrl);
      setAudioMissing(false);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [call, id]);

  const isVideoCall = useMemo(
    () => (call ? isVideoMimeType(call.audioMimeType) : false),
    [call],
  );

  const onTimeUpdate = useCallback(() => {
    const el = mediaRef.current;
    if (!el || !call?.segments?.length) return;
    const t = el.currentTime;
    const idx = call.segments.findIndex((s) => t >= s.start && t < s.end);
    const next = idx >= 0 ? idx : -1;
    setActiveSeg((prev) => {
      if (prev !== next && next >= 0) {
        segRefs.current[next]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
      return next;
    });
  }, [call?.segments]);

  const topicEntries = useMemo(() => {
    if (!call) return [];
    return (
      Object.entries(call.topicIntensity) as [
        keyof SalesCallRecord["topicIntensity"],
        number,
      ][]
    );
  }, [call]);

  const patchFollowUp = async (
    key: keyof SalesCallRecord["followUpActions"],
    value: boolean
  ) => {
    if (!call) return;
    const res = await fetch(`/api/calls/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpActions: { [key]: value } }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { call: CallDetail };
    setCall(data.call);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading call…
      </div>
    );
  }

  if (err === "notfound" || !call) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Call not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You may not have access or the ID is invalid.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (err === "load") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-destructive">Could not load this call.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  }

  const repPct = Math.round(call.talkRatioRepPct);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-amber-50/40 dark:from-stone-950 dark:via-background dark:to-stone-900/40">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>

        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {new Date(call.createdAt).toLocaleString()}
            {call.ownerEmail ? ` · ${call.ownerEmail}` : null}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Call dashboards
          </h1>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-primary" />
                Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-semibold capitalize">
                {call.sentiment.overall}
              </p>
              <SentimentPieChart
                positivePct={call.sentiment.positivePct}
                neutralPct={call.sentiment.neutralPct}
                negativePct={call.sentiment.negativePct}
                size={100}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Talk time split
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TalkTimePie repPct={repPct} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <UserRound className="h-4 w-4 text-primary" />
                Customer score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-semibold tabular-nums text-primary">
                  {call.customerSatisfactionScore.toFixed(1)}
                </span>
                <span className="pb-1 text-sm text-muted-foreground">/ 10</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Inferred from transcript tone and engagement.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-200/80 dark:border-emerald-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-800 dark:text-emerald-300">
                Positive observations
              </CardTitle>
              <CardDescription>What went well on the call</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/90">
                {call.coachingNotes.positiveObservations.length ? (
                  call.coachingNotes.positiveObservations.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {x}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">—</li>
                )}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive">
                Negative observations
              </CardTitle>
              <CardDescription>Coaching opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/90">
                {call.coachingNotes.negativeObservations.length ? (
                  call.coachingNotes.negativeObservations.map((x, i) => (
                    <li key={i} className="flex gap-2">
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                      {x}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">—</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {isVideoCall ? (
                <Video className="h-4 w-4 text-primary" />
              ) : (
                <Headphones className="h-4 w-4 text-primary" />
              )}
              Playback & synced transcript
            </CardTitle>
            <CardDescription>
              Whisper segments highlight while {isVideoCall ? "video" : "audio"}{" "}
              plays.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div>
              {audioUrl ? (
                isVideoCall ? (
                  <video
                    ref={(el) => {
                      mediaRef.current = el;
                    }}
                    src={audioUrl}
                    controls
                    playsInline
                    className="w-full max-h-[min(280px,50vh)] rounded-lg border bg-black object-contain"
                    onTimeUpdate={onTimeUpdate}
                    onSeeked={onTimeUpdate}
                    onError={() => {
                      setAudioMissing(true);
                      setAudioUrl(null);
                    }}
                  />
                ) : (
                  <audio
                    ref={(el) => {
                      mediaRef.current = el;
                    }}
                    src={audioUrl}
                    controls
                    className="w-full rounded-lg border bg-card"
                    onTimeUpdate={onTimeUpdate}
                    onSeeked={onTimeUpdate}
                    onError={() => {
                      setAudioMissing(true);
                      setAudioUrl(null);
                    }}
                  />
                )
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  {audioMissing
                    ? "No recording stored for this call. New uploads save audio on disk when Blob is off, or use Vercel Blob with BLOB_READ_WRITE_TOKEN. Re-upload to attach a recording."
                    : "Loading recording…"}
                </div>
              )}
            </div>
            <ScrollArea className="h-[220px] rounded-lg border bg-muted/20 p-3 lg:h-[180px]">
              {call.segments.length > 0 ? (
                <div className="space-y-2 pr-3">
                  {call.segments.map((seg, i) => (
                    <div
                      key={`${seg.start}-${i}`}
                      ref={(el) => {
                        segRefs.current[i] = el;
                      }}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-sm leading-relaxed transition-colors",
                        activeSeg === i
                          ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                          : "text-foreground/85"
                      )}
                    >
                      <span className="mr-2 font-mono text-[10px] text-muted-foreground tabular-nums">
                        {seg.start.toFixed(1)}s
                      </span>
                      {seg.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90">
                  {call.transcript}
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Tabs defaultValue="followup" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 lg:grid-cols-4">
            <TabsTrigger value="followup" className="text-xs sm:text-sm">
              Follow-up actions
            </TabsTrigger>
            <TabsTrigger value="questionnaire" className="text-xs sm:text-sm">
              Questionnaire
            </TabsTrigger>
            <TabsTrigger value="agent" className="text-xs sm:text-sm">
              Agent scoring
            </TabsTrigger>
            <TabsTrigger value="keywords" className="text-xs sm:text-sm">
              Keyword heatmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followup">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Follow-up actions</CardTitle>
                <CardDescription>
                  Toggle checkboxes to update the database (rep coaching checklist).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {(
                    Object.keys(call.followUpActions) as Array<
                      keyof SalesCallRecord["followUpActions"]
                    >
                  ).map((key) => (
                    <li
                      key={key}
                      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary"
                        checked={call.followUpActions[key]}
                        onChange={(e) =>
                          void patchFollowUp(key, e.target.checked)
                        }
                      />
                      <span>{FOLLOW_UP_LABELS[key]}</span>
                    </li>
                  ))}
                </ul>
                {call.actionItems.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Additional action items
                    </p>
                    <ol className="list-decimal space-y-1 pl-5 text-sm">
                      {call.actionItems.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questionnaire">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Business questionnaire
                </CardTitle>
                <CardDescription>
                  Seven topics — checkmark when intensity ≥ {TOPIC_THRESHOLD}%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {topicEntries.map(([key, intensity]) => {
                    const hit = intensity >= TOPIC_THRESHOLD;
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          {hit ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/35" />
                          )}
                          {QUESTIONNAIRE_LABELS[key]}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {Math.round(intensity)}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent scoring (0–10)</CardTitle>
                <CardDescription>Radar view across five rubric dimensions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AgentRadarChart performance={call.agentPerformance} />
                <div className="border-t pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Sentiment quotes
                  </p>
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Positive
                      </p>
                      <ul className="mt-1 list-inside list-disc text-muted-foreground">
                        {call.sentiment.positiveQuotes.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                        {call.sentiment.positiveQuotes.length === 0 ? (
                          <li className="list-none text-xs">—</li>
                        ) : null}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        Neutral
                      </p>
                      <ul className="mt-1 list-inside list-disc text-muted-foreground">
                        {call.sentiment.neutralQuotes.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                        {call.sentiment.neutralQuotes.length === 0 ? (
                          <li className="list-none text-xs">—</li>
                        ) : null}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-destructive">
                        Negative
                      </p>
                      <ul className="mt-1 list-inside list-disc text-muted-foreground">
                        {call.sentiment.negativeQuotes.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                        {call.sentiment.negativeQuotes.length === 0 ? (
                          <li className="list-none text-xs">—</li>
                        ) : null}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Keyword analysis</CardTitle>
                <CardDescription>
                  Topic intensity heatmap vs questionnaire themes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {topicEntries.map(([key, intensity]) => (
                    <div
                      key={key}
                      className="flex flex-col items-center justify-end rounded-xl border bg-card p-3 text-center"
                    >
                      <div className="mb-2 flex h-24 w-full max-w-[4.5rem] items-end justify-center rounded-md bg-muted">
                        <div
                          className="w-full rounded-md bg-primary transition-all"
                          style={{
                            height: `${Math.max(8, intensity)}%`,
                            opacity: 0.35 + (intensity / 100) * 0.65,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium leading-tight">
                        {QUESTIONNAIRE_LABELS[key]}
                      </span>
                      <span className="mt-1 font-mono text-[10px] text-muted-foreground tabular-nums">
                        {Math.round(intensity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Business questions asked
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {call.coachingNotes.businessQuestionsAsked.map((x, i) => (
                      <li key={i}>· {x}</li>
                    ))}
                    {call.coachingNotes.businessQuestionsAsked.length === 0 ? (
                      <li className="text-xs">—</li>
                    ) : null}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Executive summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>{call.summary}</p>
            <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Wins
                </p>
                <ul className="mt-1 list-inside list-disc">
                  {call.wins.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Risks
                </p>
                <ul className="mt-1 list-inside list-disc">
                  {call.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
