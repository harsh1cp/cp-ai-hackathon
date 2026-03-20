import OpenAI from "openai";

let client: OpenAI | null = null;

/** Server-only OpenAI client. Set OPENAI_API_KEY in `.env.local`. */
export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/** Parsed JSON from the sales chat model (Part 1). */
export type SalesChatModelPayload = {
  reply: string;
  suggestedNextQuestionId: number | null;
  suggestedNextBrief?: string;
};

/**
 * Parse model JSON; handles optional ```json fences.
 * Returns null if JSON is invalid or missing reply.
 */
export function parseSalesChatModelJson(raw: string): SalesChatModelPayload | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const o = JSON.parse(cleaned) as Record<string, unknown>;
    const reply = typeof o.reply === "string" ? o.reply.trim() : "";
    if (!reply) return null;

    let suggestedNextQuestionId: number | null = null;
    const sid = o.suggestedNextQuestionId;
    if (typeof sid === "number" && Number.isInteger(sid) && sid >= 1 && sid <= 15) {
      suggestedNextQuestionId = sid;
    } else if (typeof sid === "string") {
      const n = parseInt(sid, 10);
      if (n >= 1 && n <= 15) suggestedNextQuestionId = n;
    }

    const suggestedNextBrief =
      typeof o.suggestedNextBrief === "string" ? o.suggestedNextBrief.trim() : undefined;

    return { reply, suggestedNextQuestionId, suggestedNextBrief };
  } catch {
    return null;
  }
}
