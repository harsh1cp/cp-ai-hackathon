import type {
  ExtendedSalesCallAnalysis,
  SalesCallRecord,
  TranscriptSegment,
} from "@/lib/sales-call-model";

/** Used when rehydrating older persisted calls or partial data. */
export const DEFAULT_EXTENDED_ANALYSIS: ExtendedSalesCallAnalysis = {
  summary: "",
  talkRatioRepPct: 50,
  customerSatisfactionScore: 5,
  overallScore: 5,
  sentiment: {
    overall: "neutral",
    positivePct: 33.33,
    neutralPct: 33.34,
    negativePct: 33.33,
    positiveQuotes: [],
    neutralQuotes: [],
    negativeQuotes: [],
  },
  agentPerformance: {
    communicationClarity: 5,
    politeness: 5,
    businessKnowledge: 5,
    problemHandling: 5,
    listeningAbility: 5,
  },
  topicIntensity: {
    budget: 0,
    competitor: 0,
    style: 0,
    remodel: 0,
    install: 0,
    delivery: 0,
    warranty: 0,
  },
  followUpActions: {
    sendQuote: false,
    shareDesigns: false,
    scheduleConsult: false,
    reviewCompetitorQuote: false,
  },
  coachingNotes: {
    positiveObservations: [],
    negativeObservations: [],
    businessQuestionsAsked: [],
  },
  actionItems: [],
  objectionsRaised: [],
  wins: [],
  risks: [],
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asSegments(v: unknown): TranscriptSegment[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isObject)
    .map((s) => ({
      start: typeof s.start === "number" ? s.start : 0,
      end: typeof s.end === "number" ? s.end : 0,
      text: typeof s.text === "string" ? s.text : "",
    }))
    .filter((s) => s.text.length > 0);
}

/** Merge persisted JSON into a full `SalesCallRecord` for UI. */
export function normalizePersistedCall(raw: unknown): SalesCallRecord | null {
  if (!isObject(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : null;
  const transcript = typeof raw.transcript === "string" ? raw.transcript : "";
  if (!id || !createdAt) return null;

  const durationSeconds =
    typeof raw.durationSeconds === "number" ? raw.durationSeconds : 0;
  const audioMimeType =
    typeof raw.audioMimeType === "string" ? raw.audioMimeType : "audio/webm";

  const merged: SalesCallRecord = {
    ...DEFAULT_EXTENDED_ANALYSIS,
    id,
    createdAt,
    transcript,
    durationSeconds,
    segments: asSegments(raw.segments),
    audioMimeType,
    fileName:
      typeof raw.fileName === "string" && raw.fileName.length > 0
        ? raw.fileName
        : null,
  };

  if (isObject(raw.sentiment)) {
    merged.sentiment = {
      ...merged.sentiment,
      ...raw.sentiment,
      overall:
        raw.sentiment.overall === "positive" ||
        raw.sentiment.overall === "neutral" ||
        raw.sentiment.overall === "negative"
          ? raw.sentiment.overall
          : merged.sentiment.overall,
      positiveQuotes: Array.isArray(raw.sentiment.positiveQuotes)
        ? (raw.sentiment.positiveQuotes as string[])
        : merged.sentiment.positiveQuotes,
      neutralQuotes: Array.isArray(raw.sentiment.neutralQuotes)
        ? (raw.sentiment.neutralQuotes as string[])
        : merged.sentiment.neutralQuotes,
      negativeQuotes: Array.isArray(raw.sentiment.negativeQuotes)
        ? (raw.sentiment.negativeQuotes as string[])
        : merged.sentiment.negativeQuotes,
    };
  }

  if (isObject(raw.agentPerformance)) {
    merged.agentPerformance = {
      ...merged.agentPerformance,
      ...raw.agentPerformance,
    } as SalesCallRecord["agentPerformance"];
  }

  if (isObject(raw.topicIntensity)) {
    merged.topicIntensity = {
      ...merged.topicIntensity,
      ...raw.topicIntensity,
    } as SalesCallRecord["topicIntensity"];
  }

  if (isObject(raw.followUpActions)) {
    merged.followUpActions = {
      ...merged.followUpActions,
      ...raw.followUpActions,
    } as SalesCallRecord["followUpActions"];
  }

  if (isObject(raw.coachingNotes)) {
    merged.coachingNotes = {
      positiveObservations: Array.isArray(raw.coachingNotes.positiveObservations)
        ? (raw.coachingNotes.positiveObservations as string[])
        : [],
      negativeObservations: Array.isArray(raw.coachingNotes.negativeObservations)
        ? (raw.coachingNotes.negativeObservations as string[])
        : [],
      businessQuestionsAsked: Array.isArray(
        raw.coachingNotes.businessQuestionsAsked
      )
        ? (raw.coachingNotes.businessQuestionsAsked as string[])
        : [],
    };
  }

  if (typeof raw.summary === "string") merged.summary = raw.summary;
  if (typeof raw.talkRatioRepPct === "number")
    merged.talkRatioRepPct = raw.talkRatioRepPct;
  if (typeof raw.customerSatisfactionScore === "number")
    merged.customerSatisfactionScore = raw.customerSatisfactionScore;
  if (typeof raw.overallScore === "number") merged.overallScore = raw.overallScore;

  merged.actionItems = Array.isArray(raw.actionItems)
    ? (raw.actionItems as string[])
    : merged.actionItems;
  merged.objectionsRaised = Array.isArray(raw.objectionsRaised)
    ? (raw.objectionsRaised as string[])
    : merged.objectionsRaised;
  merged.wins = Array.isArray(raw.wins) ? (raw.wins as string[]) : merged.wins;
  merged.risks = Array.isArray(raw.risks) ? (raw.risks as string[]) : merged.risks;

  return merged;
}
