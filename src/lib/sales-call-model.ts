import { z } from "zod";

export const transcriptSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
});

export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;

/** Structured output from the extended AI analyzer (Vercel AI SDK + OpenAI). */
export const extendedSalesCallAnalysisSchema = z.object({
  summary: z.string().describe("2–4 sentence executive summary of the call"),
  talkRatioRepPct: z
    .number()
    .min(0)
    .max(100)
    .describe("Estimated % of airtime for the sales rep vs customer"),
  customerSatisfactionScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Inferred customer satisfaction / engagement 0–10"),
  overallScore: z
    .number()
    .min(0)
    .max(10)
    .describe("Overall call quality for coaching 0–10"),
  sentiment: z.object({
    overall: z.enum(["positive", "neutral", "negative"]),
    positivePct: z.number().min(0).max(100),
    neutralPct: z.number().min(0).max(100),
    negativePct: z.number().min(0).max(100),
    positiveQuotes: z.array(z.string()).max(6),
    neutralQuotes: z.array(z.string()).max(6),
    negativeQuotes: z.array(z.string()).max(6),
  }),
  agentPerformance: z.object({
    communicationClarity: z.number().min(0).max(10),
    politeness: z.number().min(0).max(10),
    businessKnowledge: z.number().min(0).max(10),
    problemHandling: z.number().min(0).max(10),
    listeningAbility: z.number().min(0).max(10),
  }),
  topicIntensity: z.object({
    budget: z.number().min(0).max(100),
    competitor: z.number().min(0).max(100),
    style: z.number().min(0).max(100),
    remodel: z.number().min(0).max(100),
    install: z.number().min(0).max(100),
    delivery: z.number().min(0).max(100),
    warranty: z.number().min(0).max(100),
  }),
  followUpActions: z.object({
    sendQuote: z.boolean(),
    shareDesigns: z.boolean(),
    scheduleConsult: z.boolean(),
    reviewCompetitorQuote: z.boolean(),
  }),
  coachingNotes: z.object({
    positiveObservations: z.array(z.string()).max(8),
    negativeObservations: z.array(z.string()).max(8),
    businessQuestionsAsked: z.array(z.string()).max(12),
  }),
  actionItems: z.array(z.string()).max(15),
  objectionsRaised: z.array(z.string()).max(10),
  wins: z.array(z.string()).max(8),
  risks: z.array(z.string()).max(8),
});

export type ExtendedSalesCallAnalysis = z.infer<
  typeof extendedSalesCallAnalysisSchema
>;

/** One analyzed call persisted in Zustand + optional IndexedDB audio blob. */
export type SalesCallRecord = ExtendedSalesCallAnalysis & {
  id: string;
  createdAt: string;
  transcript: string;
  durationSeconds: number;
  segments: TranscriptSegment[];
  audioMimeType: string;
  /** Original upload filename when saved from the analyzer pipeline. */
  fileName?: string | null;
};

export const QUESTIONNAIRE_LABELS: Record<
  keyof ExtendedSalesCallAnalysis["topicIntensity"],
  string
> = {
  budget: "Budget",
  competitor: "Competitor",
  style: "Style",
  remodel: "Remodel",
  install: "Install",
  delivery: "Delivery",
  warranty: "Warranty",
};

export function normalizeSentimentPercentages(
  s: ExtendedSalesCallAnalysis["sentiment"]
): Pick<
  ExtendedSalesCallAnalysis["sentiment"],
  "positivePct" | "neutralPct" | "negativePct"
> {
  const sum = s.positivePct + s.neutralPct + s.negativePct;
  if (sum <= 0) {
    return { positivePct: 33.33, neutralPct: 33.34, negativePct: 33.33 };
  }
  const f = 100 / sum;
  return {
    positivePct: Math.round(s.positivePct * f * 10) / 10,
    neutralPct: Math.round(s.neutralPct * f * 10) / 10,
    negativePct: Math.round(s.negativePct * f * 10) / 10,
  };
}
