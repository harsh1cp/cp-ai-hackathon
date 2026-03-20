import { SALES_QUESTIONS, getQuestionById } from "@/lib/sales-questions";
import { upsellInstructionForQuestion } from "@/lib/sales-upsell";

const CATALOG = SALES_QUESTIONS.map(
  (x) => `Q${x.id} (${x.stage}): ${x.text.trim()}`
).join("\n");

/**
 * System prompt for Part 1: top rep, Q + history, next-Q suggestion, objections/upsell.
 * Model must return JSON (see route handler).
 */
export function buildSalesChatSystemPrompt(currentQuestionId?: number): string {
  const q = currentQuestionId != null ? getQuestionById(currentQuestionId) : undefined;
  const focus =
    q != null
      ? `Active scripted question: Q${q.id} (${q.stage}) — "${q.text.trim()}". Anchor your reply to this Q and prior messages.`
      : `Infer the buyer's intent from the latest user message and full history (no single Q id was sent).`;

  const core = `You are a top sales rep for premium kitchen cabinets. Respond to Q{ID} plus full conversation history. Suggest the single best next scripted question. Handle objections and upsell when it fits — warm, confident, never pushy.

${focus}

Output rules:
- Customer-facing copy in "reply": about 2–4 short sentences unless they asked for detail.
- "suggestedNextQuestionId": integer 1–15 from the catalog below, or null only if truly unclear.
- "suggestedNextBrief": one line for the rep (why that Q next).

You MUST respond with valid JSON only (no markdown fences), exactly this shape:
{"reply":"string","suggestedNextQuestionId":number or null,"suggestedNextBrief":"string"}

Catalog (Q1–Q15 only):
${CATALOG}`;

  const extra = upsellInstructionForQuestion(currentQuestionId);
  return extra ? `${core}\n\n${extra}` : core;
}
