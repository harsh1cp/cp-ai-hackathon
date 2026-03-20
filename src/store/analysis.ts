import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SalesCallRecord } from "@/lib/sales-call-model";
import { normalizePersistedCall } from "@/lib/sales-call-defaults";

export type { SalesCallRecord } from "@/lib/sales-call-model";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

type AnalysisState = {
  calls: SalesCallRecord[];
  addCall: (input: Omit<SalesCallRecord, "id" | "createdAt">) => string;
  removeCall: (id: string) => void;
  getCall: (id: string) => SalesCallRecord | undefined;
};

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      calls: [],
      addCall: (input) => {
        const id = newId();
        const record: SalesCallRecord = {
          ...input,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ calls: [record, ...s.calls] }));
        return id;
      },
      removeCall: (id) =>
        set((s) => ({ calls: s.calls.filter((c) => c.id !== id) })),
      getCall: (id) => get().calls.find((c) => c.id === id),
    }),
    {
      name: "cp-prompt-x-sales-analysis",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ calls: s.calls }),
      merge: (persistedState, currentState): AnalysisState => {
        const p = persistedState as { calls?: unknown[] } | null | undefined;
        if (!p || !Array.isArray(p.calls)) {
          return currentState;
        }
        const calls: SalesCallRecord[] = p.calls
          .map((c) => normalizePersistedCall(c))
          .filter((c): c is SalesCallRecord => c !== null);
        return { ...currentState, calls };
      },
    }
  )
);

export function selectAggregates(calls: SalesCallRecord[]) {
  const n = calls.length;
  if (n === 0) {
    return {
      totalCalls: 0,
      avgScore: 0,
      avgDurationSeconds: 0,
      actionItemsCount: 0,
      sentimentMix: { positivePct: 0, neutralPct: 0, negativePct: 0 },
    };
  }
  let scoreSum = 0;
  let durSum = 0;
  let actions = 0;
  let p = 0;
  let neu = 0;
  let neg = 0;
  for (const c of calls) {
    scoreSum += c.overallScore;
    durSum += c.durationSeconds;
    actions += c.actionItems.length;
    p += c.sentiment.positivePct;
    neu += c.sentiment.neutralPct;
    neg += c.sentiment.negativePct;
  }
  return {
    totalCalls: n,
    avgScore: Math.round((scoreSum / n) * 10) / 10,
    avgDurationSeconds: Math.round(durSum / n),
    actionItemsCount: actions,
    sentimentMix: {
      positivePct: Math.round((p / n) * 10) / 10,
      neutralPct: Math.round((neu / n) * 10) / 10,
      negativePct: Math.round((neg / n) * 10) / 10,
    },
  };
}
