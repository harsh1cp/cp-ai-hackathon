"use client";

import { useEffect, useMemo } from "react";
import { estimateQuoteMidpoint } from "@/lib/quote-calculator";
import { useChatStore } from "@/store/chat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function cellOrDash(value: string) {
  const t = value.trim();
  return t.length > 0 ? t : "—";
}

export function QuoteComparisonTable() {
  const kitchenSqFt = useChatStore((s) => s.kitchenSqFt);
  const targetBudget = useChatStore((s) => s.targetBudget);
  const competitorMaterial = useChatStore((s) => s.competitorMaterial);
  const competitorWarranty = useChatStore((s) => s.competitorWarranty);
  const competitorSoftClose = useChatStore((s) => s.competitorSoftClose);
  const competitorPrice = useChatStore((s) => s.competitorPrice);
  const setCompetitorQuote = useChatStore((s) => s.setCompetitorQuote);

  useEffect(() => {
    useChatStore.persist.rehydrate();
  }, []);

  const midpoint = useMemo(
    () =>
      estimateQuoteMidpoint(
        parseFloat(kitchenSqFt),
        parseFloat(targetBudget)
      ),
    [kitchenSqFt, targetBudget]
  );

  const rows = useMemo(
    () => [
      {
        feature: "Material",
        us: "Premium plywood",
        them: cellOrDash(competitorMaterial),
      },
      {
        feature: "Warranty",
        us: "Lifetime",
        them: cellOrDash(competitorWarranty),
      },
      {
        feature: "Soft-close",
        us: "Included",
        them: cellOrDash(competitorSoftClose),
      },
      {
        feature: "Price",
        us: `$${midpoint.toLocaleString()} (illustrative midpoint)`,
        them: cellOrDash(competitorPrice),
      },
    ],
    [
      midpoint,
      competitorMaterial,
      competitorWarranty,
      competitorSoftClose,
      competitorPrice,
    ]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote comparison</CardTitle>
        <CardDescription>
          “Our” column follows this demo. Enter competitor notes from a bid or
          call — values persist in this browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="comp-mat" className="text-xs">
              Competitor · material
            </Label>
            <Input
              id="comp-mat"
              value={competitorMaterial}
              onChange={(e) =>
                setCompetitorQuote({ competitorMaterial: e.target.value })
              }
              placeholder="e.g. Standard particle board"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comp-war" className="text-xs">
              Competitor · warranty
            </Label>
            <Input
              id="comp-war"
              value={competitorWarranty}
              onChange={(e) =>
                setCompetitorQuote({ competitorWarranty: e.target.value })
              }
              placeholder="e.g. 5 years"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comp-soft" className="text-xs">
              Competitor · soft-close
            </Label>
            <Input
              id="comp-soft"
              value={competitorSoftClose}
              onChange={(e) =>
                setCompetitorQuote({ competitorSoftClose: e.target.value })
              }
              placeholder="e.g. Add-on $450"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comp-price" className="text-xs">
              Competitor · price
            </Label>
            <Input
              id="comp-price"
              value={competitorPrice}
              onChange={(e) =>
                setCompetitorQuote({ competitorPrice: e.target.value })
              }
              placeholder="e.g. $41,500"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[22%]">Feature</TableHead>
              <TableHead>Our quote</TableHead>
              <TableHead>Competitor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.feature}>
                <TableCell className="font-medium">{row.feature}</TableCell>
                <TableCell>{row.us}</TableCell>
                <TableCell
                  className={
                    row.them === "—"
                      ? "text-muted-foreground italic"
                      : "text-foreground"
                  }
                >
                  {row.them}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
