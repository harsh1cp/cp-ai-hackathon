"use client";

import { SALES_QUESTIONS, type SalesStage } from "@/lib/sales-questions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Stable value so Radix Select is never `undefined` (avoids SSR/client hydration mismatch). */
const NONE = "__sales_q_none__";

const STAGE_ORDER: SalesStage[] = [
  "Discovery",
  "Qualification",
  "Proposal",
  "Objection",
  "Upsell",
  "Close",
];

type Props = {
  value: string;
  onValueChange: (id: string) => void;
  id?: string;
  disabled?: boolean;
};

export function QuestionSelector({
  value,
  onValueChange,
  id = "question-selector",
  disabled,
}: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        Sales question
      </label>
      <Select
        value={value ? value : NONE}
        onValueChange={(v) => onValueChange(v === NONE ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full bg-background"
          aria-label="Sales question (Q1–Q15, optional)"
        >
          {/* No placeholder: avoids Radix data-placeholder "" vs undefined SSR mismatch; NONE item supplies label. */}
        <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE} className="text-muted-foreground">
            Select Q1–Q15 (optional)
          </SelectItem>
          <SelectSeparator />
          {STAGE_ORDER.map((stage) => (
            <SelectGroup key={stage}>
              <SelectLabel>{stage}</SelectLabel>
              {SALES_QUESTIONS.filter((q) => q.stage === stage).map((q) => (
                <SelectItem key={q.id} value={String(q.id)}>
                  Q{q.id}: {q.text.trim().slice(0, 70)}
                  {q.text.length > 70 ? "…" : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
