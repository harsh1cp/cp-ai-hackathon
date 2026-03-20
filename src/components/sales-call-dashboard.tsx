"use client";

import Link from "next/link";
import { MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SentimentPieChart } from "@/components/sentiment-pie-chart";
import { SalesAudioDropzone } from "@/components/sales-audio-dropzone";
import { selectAggregates, useAnalysisStore } from "@/store/analysis";

function formatDuration(seconds: number) {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function SalesCallDashboard() {
  const calls = useAnalysisStore((s) => s.calls);
  const agg = selectAggregates(calls);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-amber-50/40 dark:from-stone-950 dark:via-background dark:to-stone-900/40">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              CP Prompt-X · Sales Call Analyzer
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              AI sales call analyzer
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Upload call audio → Whisper transcription → structured coaching
              analysis. Built with Next.js, Tailwind, shadcn/ui, Vercel AI SDK,
              OpenAI, Zustand, and Cursor Auto.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <a
                className="font-medium text-primary underline underline-offset-4 hover:no-underline"
                href="https://gamma.app/docs/CP-Prompt-X-The-AI-Vibe-Coding-Hackathon-fbvuafc2us3jw5o?mode=doc"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hackathon brief (Gamma)
              </a>
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-2">
            <Link href="/chat">
              <MessageSquare className="h-4 w-4" />
              Sales chat demo
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total calls</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {agg.totalCalls}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Stored in this browser (local persistence).
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
              Model-rated quality across saved analyses.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg duration</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {agg.totalCalls
                  ? formatDuration(agg.avgDurationSeconds)
                  : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              From browser-reported audio length when available.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Action items</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {agg.actionItemsCount}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Total follow-ups across all calls.
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Aggregate sentiment
              </CardTitle>
              <CardDescription>
                Average of sentiment percentages across analyzed calls.
              </CardDescription>
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
                  Analyze a call to see the pie chart.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <SalesAudioDropzone />
          </div>
        </div>

        {calls.length > 0 ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Recent analyses</CardTitle>
              <CardDescription>Open a call to view seven insight dashboards.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y rounded-lg border">
                {calls.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/call/${c.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium text-primary">
                        Score {c.overallScore.toFixed(1)} · {c.sentiment.overall}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()} ·{" "}
                        {formatDuration(c.durationSeconds)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Setup</CardTitle>
            <CardDescription>
              Add{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                OPENAI_API_KEY
              </code>{" "}
              to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                .env.local
              </code>
              . Never commit API keys.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
