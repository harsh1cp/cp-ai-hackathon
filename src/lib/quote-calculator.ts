/**
 * Rough cabinet estimate: ties spend appetite (budget) to layout size.
 * Not a binding quote — demo math for the hackathon UI.
 */
export function estimateCabinetRange(
  kitchenSqFt: number,
  totalBudget: number
): { low: number; high: number; note: string } {
  const sq = Number.isFinite(kitchenSqFt) && kitchenSqFt > 0 ? kitchenSqFt : 120;
  const budget =
    Number.isFinite(totalBudget) && totalBudget > 0 ? totalBudget : 25000;

  const spendFactor = Math.min(1.15, Math.max(0.35, budget / (sq * 220)));
  const perSqLow = 140 + spendFactor * 95;
  const perSqHigh = 185 + spendFactor * 125;
  const low = Math.round(sq * perSqLow);
  const high = Math.round(sq * perSqHigh);

  const note =
    "Illustrative range based on kitchen size and stated budget tier. Final pricing follows field measure, materials, and install scope.";

  return { low, high, note };
}

/** Single “hero” number for comparison tables (midpoint of illustrative range). */
export function estimateQuoteMidpoint(
  kitchenSqFt: number,
  totalBudget: number
): number {
  const { low, high } = estimateCabinetRange(kitchenSqFt, totalBudget);
  return Math.round((low + high) / 2);
}
