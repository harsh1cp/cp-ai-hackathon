import { getQuestionById } from "@/lib/sales-questions";

/** Injected into the chat API so the model follows hackathon upsell rules. */
export function upsellInstructionForQuestion(questionId: number | undefined): string {
  if (questionId == null) return "";

  const q = getQuestionById(questionId);
  const label = q ? `Q${questionId} (${q.stage})` : `Q${questionId}`;

  if (questionId === 7) {
    return `[Upsell context — ${label}: budget just shared] Gently suggest premium finishes / durable top coats that protect resale value; tie to their stated style if known.`;
  }
  if (questionId === 13) {
    return `[Upsell context — ${label}: concerns] Proactively normalize price/material worries; offer structured financing or phased payment plans if budget tension appears.`;
  }
  if (questionId === 14) {
    return `[Upsell context — ${label}: add-ons] Mention soft-close hardware: quieter daily use, less slam wear, ~$200 long-term savings vs replacing hinges later (illustrative).`;
  }
  if (questionId === 15) {
    return `[Close context — ${label}] End with a confident, low-pressure CTA: offer a design consultation or site measure to lock timeline and install clarity.`;
  }

  return "";
}
