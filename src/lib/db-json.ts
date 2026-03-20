import type { Prisma } from "@prisma/client";
import type { ExtendedSalesCallAnalysis } from "@/lib/sales-call-model";
import type { TranscriptSegment } from "@/lib/sales-call-model";

/** Postgres Json columns return objects; SQLite used stringified JSON. */
export function parseAnalysisJson(
  raw: string | Prisma.JsonValue
): ExtendedSalesCallAnalysis {
  try {
    const v =
      typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      return v as ExtendedSalesCallAnalysis;
    }
    throw new Error("bad shape");
  } catch {
    throw new Error("Invalid stored analysis JSON");
  }
}

export function parseSegmentsJson(
  raw: string | Prisma.JsonValue
): TranscriptSegment[] {
  try {
    if (Array.isArray(raw)) return raw as TranscriptSegment[];
    if (typeof raw === "string") {
      const v = JSON.parse(raw) as unknown;
      return Array.isArray(v) ? (v as TranscriptSegment[]) : [];
    }
    return [];
  } catch {
    return [];
  }
}

export function stringifyForDb<T>(value: T): string {
  return JSON.stringify(value);
}
