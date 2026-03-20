"use client";

import { useEffect, useMemo } from "react";
import { estimateCabinetRange } from "@/lib/quote-calculator";
import { useChatStore } from "@/store/chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QuoteCalculator() {
  const kitchenSqFt = useChatStore((s) => s.kitchenSqFt);
  const targetBudget = useChatStore((s) => s.targetBudget);
  const setQuoteInputs = useChatStore((s) => s.setQuoteInputs);

  useEffect(() => {
    useChatStore.persist.rehydrate();
  }, []);

  const result = useMemo(() => {
    return estimateCabinetRange(
      parseFloat(kitchenSqFt),
      parseFloat(targetBudget)
    );
  }, [kitchenSqFt, targetBudget]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote calculator</CardTitle>
        <CardDescription>
          Kitchen size × budget tier → estimated cabinet investment range
          (demo). Syncs with the comparison table below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sqft">Kitchen size (sq ft)</Label>
            <Input
              id="sqft"
              inputMode="decimal"
              value={kitchenSqFt}
              onChange={(e) =>
                setQuoteInputs(e.target.value, targetBudget)
              }
              placeholder="e.g. 140"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Target cabinet budget (USD)</Label>
            <Input
              id="budget"
              inputMode="numeric"
              value={targetBudget}
              onChange={(e) =>
                setQuoteInputs(kitchenSqFt, e.target.value)
              }
              placeholder="e.g. 32000"
            />
          </div>
        </div>
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium text-foreground">
            Estimated cabinet range:{" "}
            <span className="text-primary">
              ${result.low.toLocaleString()} – ${result.high.toLocaleString()}
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{result.note}</p>
        </div>
      </CardContent>
    </Card>
  );
}
