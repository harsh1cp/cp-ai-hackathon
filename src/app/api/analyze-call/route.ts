import { NextResponse } from "next/server";
import { runExtendedSalesCallAnalysis } from "@/lib/ai-analyzer";
import type { TranscriptSegment } from "@/lib/sales-call-model";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  transcript?: string;
  durationSeconds?: number;
  segments?: unknown;
};

function parseSegments(raw: unknown): TranscriptSegment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is { start: number; end: number; text: string } =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as TranscriptSegment).start === "number" &&
        typeof (s as TranscriptSegment).end === "number" &&
        typeof (s as TranscriptSegment).text === "string"
    )
    .map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }))
    .filter((s) => s.text.length > 0);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const transcript =
      typeof body.transcript === "string" ? body.transcript.trim() : "";
    if (!transcript) {
      return NextResponse.json(
        { error: "transcript is required" },
        { status: 400 }
      );
    }

    const durationSeconds =
      typeof body.durationSeconds === "number" && body.durationSeconds >= 0
        ? body.durationSeconds
        : 0;

    const segments = parseSegments(body.segments);

    const analysis = await runExtendedSalesCallAnalysis(
      transcript,
      durationSeconds
    );

    return NextResponse.json({
      transcript,
      durationSeconds,
      segments,
      summary: analysis.summary,
      talkRatioRepPct: analysis.talkRatioRepPct,
      customerSatisfactionScore: analysis.customerSatisfactionScore,
      overallScore: analysis.overallScore,
      sentiment: analysis.sentiment,
      agentPerformance: analysis.agentPerformance,
      topicIntensity: analysis.topicIntensity,
      followUpActions: analysis.followUpActions,
      coachingNotes: analysis.coachingNotes,
      actionItems: analysis.actionItems,
      objectionsRaised: analysis.objectionsRaised,
      wins: analysis.wins,
      risks: analysis.risks,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("API key")
        ? 500
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
