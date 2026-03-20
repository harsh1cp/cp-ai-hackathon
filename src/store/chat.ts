"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessageDTO } from "@/lib/chat-types";

/** One row in persisted chat history */
export type ChatMessage = ChatMessageDTO;

type ChatState = {
  messages: ChatMessage[];
  kitchenSqFt: string;
  targetBudget: string;
  /** Optional competitor line items for the quote comparison table */
  competitorMaterial: string;
  competitorWarranty: string;
  competitorSoftClose: string;
  competitorPrice: string;
  addMessage: (msg: Omit<ChatMessage, "id"> & { id?: string }) => void;
  clear: () => void;
  setQuoteInputs: (kitchenSqFt: string, targetBudget: string) => void;
  setCompetitorQuote: (
    patch: Partial<{
      competitorMaterial: string;
      competitorWarranty: string;
      competitorSoftClose: string;
      competitorPrice: string;
    }>
  ) => void;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const chatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      kitchenSqFt: "140",
      targetBudget: "32000",
      competitorMaterial: "",
      competitorWarranty: "",
      competitorSoftClose: "",
      competitorPrice: "",
      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { ...msg, id: msg.id ?? newId() },
          ],
        })),
      clear: () => set({ messages: [] }),
      setQuoteInputs: (kitchenSqFt, targetBudget) =>
        set({ kitchenSqFt, targetBudget }),
      setCompetitorQuote: (patch) => set((s) => ({ ...s, ...patch })),
    }),
    {
      name: "cp-prompt-x-conversation",
      skipHydration: true,
    }
  )
);

/** Part 1 history store: messages + quote inputs (persisted). */
export const useChatStore = chatStore;

/** @deprecated Same store as useChatStore — kept for existing imports. */
export const useConversationStore = chatStore;
