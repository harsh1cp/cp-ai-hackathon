"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveCallAudio } from "@/lib/call-audio-db";
import type { SalesCallRecord, TranscriptSegment } from "@/lib/sales-call-model";
import { useAnalysisStore } from "@/store/analysis";

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    const done = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      done(Number.isFinite(d) && d > 0 ? d : 0);
    };
    audio.onerror = () => done(0);
  });
}

type Phase = "idle" | "transcribing" | "analyzing";

type AnalyzeResponse = Omit<
  SalesCallRecord,
  "id" | "createdAt" | "audioMimeType"
> & { error?: string };

export function SalesAudioDropzone() {
  const router = useRouter();
  const addCall = useAnalysisStore((s) => s.addCall);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle";

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      if (
        !file.type.startsWith("audio/") &&
        !/\.(mp3|wav|m4a|webm|mp4|mpeg|mpga)$/i.test(file.name)
      ) {
        setError("Please upload an audio file (e.g. mp3, wav, m4a, webm).");
        return;
      }

      let durationSeconds = 0;
      try {
        durationSeconds = await getAudioDuration(file);
      } catch {
        durationSeconds = 0;
      }

      try {
        setPhase("transcribing");
        const fd = new FormData();
        fd.append("audio", file);
        const tr = await fetch("/api/transcribe", { method: "POST", body: fd });
        const tj = (await tr.json()) as {
          transcript?: string;
          segments?: TranscriptSegment[];
          error?: string;
        };
        if (!tr.ok) {
          throw new Error(tj.error ?? "Transcription failed");
        }
        const transcript = tj.transcript?.trim();
        if (!transcript) {
          throw new Error("No transcript returned");
        }
        const segments: TranscriptSegment[] = Array.isArray(tj.segments)
          ? tj.segments
          : [];

        setPhase("analyzing");
        const ar = await fetch("/api/analyze-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, durationSeconds, segments }),
        });
        const aj = (await ar.json()) as AnalyzeResponse;
        if (!ar.ok) {
          throw new Error(aj.error ?? "Analysis failed");
        }

        const id = addCall({
          transcript: aj.transcript ?? transcript,
          durationSeconds: aj.durationSeconds ?? durationSeconds,
          segments: Array.isArray(aj.segments) ? aj.segments : segments,
          audioMimeType: file.type || "audio/webm",
          summary: aj.summary ?? "",
          talkRatioRepPct: aj.talkRatioRepPct ?? 50,
          customerSatisfactionScore: aj.customerSatisfactionScore ?? 5,
          overallScore: aj.overallScore ?? 5,
          sentiment: aj.sentiment ?? {
            overall: "neutral",
            positivePct: 33.33,
            neutralPct: 33.34,
            negativePct: 33.33,
            positiveQuotes: [],
            neutralQuotes: [],
            negativeQuotes: [],
          },
          agentPerformance: aj.agentPerformance ?? {
            communicationClarity: 5,
            politeness: 5,
            businessKnowledge: 5,
            problemHandling: 5,
            listeningAbility: 5,
          },
          topicIntensity: aj.topicIntensity ?? {
            budget: 0,
            competitor: 0,
            style: 0,
            remodel: 0,
            install: 0,
            delivery: 0,
            warranty: 0,
          },
          followUpActions: aj.followUpActions ?? {
            sendQuote: false,
            shareDesigns: false,
            scheduleConsult: false,
            reviewCompetitorQuote: false,
          },
          coachingNotes: aj.coachingNotes ?? {
            positiveObservations: [],
            negativeObservations: [],
            businessQuestionsAsked: [],
          },
          actionItems: aj.actionItems ?? [],
          objectionsRaised: aj.objectionsRaised ?? [],
          wins: aj.wins ?? [],
          risks: aj.risks ?? [],
        });

        try {
          await saveCallAudio(id, file);
        } catch {
          /* optional: audio replay unavailable */
        }

        router.push(`/call/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setPhase("idle");
      }
    },
    [addCall, router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (busy) return;
      const f = e.dataTransfer.files[0];
      if (f) void processFile(f);
    },
    [busy, processFile]
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void processFile(f);
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5 text-primary" />
          Upload a sales call
        </CardTitle>
        <CardDescription>
          Drag and drop audio or choose a file. Whisper transcribes with timed
          segments; analysis runs automatically when transcription completes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!busy) inputRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 bg-muted/30 hover:border-primary/40 hover:bg-muted/50",
            busy && "pointer-events-none opacity-70"
          )}
          onClick={() => !busy && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga"
            className="hidden"
            onChange={onPick}
            disabled={busy}
          />
          {busy ? (
            <div className="flex flex-col items-center gap-3 px-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {phase === "transcribing"
                  ? "Transcribing with Whisper…"
                  : "Running AI analysis…"}
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                This can take a minute for longer recordings.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Drop audio here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                mp3, wav, m4a, webm — keep under ~24MB
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Choose file
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
