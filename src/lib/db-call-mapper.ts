import type { Call } from "@prisma/client";
import { parseAnalysisJson, parseSegmentsJson } from "@/lib/db-json";
import type { SalesCallRecord } from "@/lib/sales-call-model";

export function prismaCallToSalesRecord(call: Call): SalesCallRecord {
  const analysis = parseAnalysisJson(call.analysis);
  const segments = parseSegmentsJson(call.segments);
  return {
    id: call.id,
    createdAt: call.createdAt.toISOString(),
    transcript: call.transcript,
    durationSeconds: call.durationSeconds,
    segments,
    audioMimeType: call.mimeType ?? "audio/webm",
    fileName: call.fileName ?? null,
    ...analysis,
  };
}
