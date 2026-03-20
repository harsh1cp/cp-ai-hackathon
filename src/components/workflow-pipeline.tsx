"use client";

import {
  AudioLines,
  LayoutDashboard,
  Sparkles,
  Upload,
} from "lucide-react";

const steps = [
  {
    Icon: Upload,
    title: "Upload",
    blurb: "Drop call recordings (MP3, WAV, M4A, …).",
  },
  {
    Icon: AudioLines,
    title: "Transcribe",
    blurb: "Whisper builds the transcript + timed segments.",
  },
  {
    Icon: Sparkles,
    title: "Analyze",
    blurb: "AI scores sentiment, rubric, and follow-ups.",
  },
  {
    Icon: LayoutDashboard,
    title: "Dashboards",
    blurb: "Open any call for charts, audio, and coaching.",
  },
] as const;

/** Replaces the old circular SVG — responsive grid, no clipping in narrow columns. */
export function WorkflowPipeline() {
  return (
    <div className="space-y-3">
      <ol className="grid gap-2.5 sm:grid-cols-1">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="flex gap-3 rounded-lg border border-border/60 bg-gradient-to-br from-card to-muted/20 px-3 py-2.5 shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/20">
              <s.Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold leading-tight">
                <span className="mr-1.5 tabular-nums text-muted-foreground">
                  {i + 1}.
                </span>
                {s.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {s.blurb}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="rounded-md bg-muted/40 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Tip: master accounts see team calls; reps see their own. Re-upload anytime
        to refresh dashboards.
      </p>
    </div>
  );
}
