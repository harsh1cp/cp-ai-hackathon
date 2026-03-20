import { useMemo } from "react";
import { SALES_QUESTIONS } from "@/lib/sales-questions";
import type { ChatMessage } from "@/store/chat";

/**
 * Suggests the next logical questions: first unanswered in stage order,
 * then adjacent ids based on the last discussed question.
 */
export function useNextQuestionSuggestions(messages: ChatMessage[]): number[] {
  return useMemo(() => {
    const asked = new Set(
      messages
        .filter((m) => m.role === "user" && m.questionId != null)
        .map((m) => m.questionId as number)
    );

    const firstGap = SALES_QUESTIONS.find((q) => !asked.has(q.id))?.id;
    const lastUserWithQ = [...messages]
      .reverse()
      .find((m) => m.role === "user" && m.questionId != null);

    const lastId = lastUserWithQ?.questionId;
    const neighbors: number[] = [];
    if (lastId != null) {
      if (lastId > 1) neighbors.push(lastId - 1);
      if (lastId < SALES_QUESTIONS.length) neighbors.push(lastId + 1);
    }

    const ordered = [
      firstGap,
      ...neighbors.filter((n) => n !== firstGap && !asked.has(n)),
      ...SALES_QUESTIONS.map((q) => q.id).filter(
        (id) => id !== firstGap && !neighbors.includes(id) && !asked.has(id)
      ),
    ].filter((id): id is number => id != null);

    return Array.from(new Set(ordered)).slice(0, 5);
  }, [messages]);
}
