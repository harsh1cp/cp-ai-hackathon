import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import {
  extendedSalesCallAnalysisSchema,
  normalizeSentimentPercentages,
  type ExtendedSalesCallAnalysis,
} from "@/lib/sales-call-model";

/**
 * Core AI prompts — Sales Call Analyzer (CP Prompt-X).
 * Woven into a single structured generation for latency and consistency.
 */
export const AI_PROMPT_SENTIMENT = `Sentiment: Classify call sentiment. Provide Positive / Neutral / Negative representative quotes (short, grounded in the transcript). Output percentage split (positivePct, neutralPct, negativePct) that reflects the emotional tone across the call; include overall dominant label.`;

export const AI_PROMPT_AGENT_PERFORMANCE = `Agent performance (0–10 each): Communication Clarity, Politeness, Business Knowledge, Problem Handling, Listening Ability. Score honestly from the transcript; use decimals only if needed (prefer integers).`;

export const AI_PROMPT_KEYWORD_TOPICS = `Keyword / topic analysis: Rate relevance or intensity 0–100 for each theme vs the business questionnaire: Budget, Competitor, Style, Remodel, Install, Delivery, Warranty. Higher = more discussion or importance in the call.`;

export const AI_PROMPT_ACTION_ITEMS = `Follow-up actions: Decide if the transcript implies these next steps — sendQuote (send quote / pricing), shareDesigns (share designs / visuals / catalog), scheduleConsult (schedule visit / measure / consultation), reviewCompetitorQuote (review or compare a competitor bid). Use booleans plus keep actionItems as short freeform strings for anything else.`;

export const AI_PROMPT_NOTES = `Coaching notes: positiveObservations (e.g. calm handling, empathy), negativeObservations (e.g. pricing confusion, interruptions), businessQuestionsAsked (specific business questions the customer asked).`;

function buildAnalyzerPrompt(transcript: string, durationSeconds: number): string {
  return `You are an expert sales-call coach for home improvement / kitchen cabinet sales.

Use the following analysis dimensions:

1) ${AI_PROMPT_SENTIMENT}

2) ${AI_PROMPT_AGENT_PERFORMANCE}

3) ${AI_PROMPT_KEYWORD_TOPICS}

4) ${AI_PROMPT_ACTION_ITEMS}

5) ${AI_PROMPT_NOTES}

Also fill: summary, talkRatioRepPct, customerSatisfactionScore, overallScore, objectionsRaised, wins, risks.

Call duration in seconds (from client; may be 0 if unknown): ${durationSeconds}

Transcript:
---
${transcript}
---

Be grounded in the transcript. If a topic was not discussed, its intensity should be low (not zero unless truly absent).`;
}

export async function runExtendedSalesCallAnalysis(
  transcript: string,
  durationSeconds: number
): Promise<ExtendedSalesCallAnalysis> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: extendedSalesCallAnalysisSchema,
    schemaName: "ExtendedSalesCallAnalysis",
    schemaDescription:
      "Full sales call analysis: sentiment with quotes, agent rubric, questionnaire heatmap, follow-ups, coaching notes.",
    prompt: buildAnalyzerPrompt(transcript, durationSeconds),
  });

  const pct = normalizeSentimentPercentages(object.sentiment);
  return {
    ...object,
    sentiment: {
      ...object.sentiment,
      ...pct,
    },
  };
}
