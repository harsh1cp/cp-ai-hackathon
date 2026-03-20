/**
 * Sanity-check Q1–Q15 catalog (no server required).
 * Run: node scripts/verify-sales-q.cjs
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/lib/sales-questions.ts");
const s = fs.readFileSync(file, "utf8");
const ids = [...s.matchAll(/\bid:\s*(\d+)/g)].map((m) => Number(m[1]));
if (ids.length !== 15) {
  console.error(`Expected 15 "id:" entries, found ${ids.length}`);
  process.exit(1);
}
const sorted = [...ids].sort((a, b) => a - b);
for (let i = 0; i < 15; i++) {
  if (sorted[i] !== i + 1) {
    console.error("Expected sequential ids 1–15, got:", sorted);
    process.exit(1);
  }
}
console.log("OK: hardcoded Q1–Q15 catalog in sales-questions.ts");
