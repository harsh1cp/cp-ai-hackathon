import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { visibleCallsWhere } from "@/lib/call-access";
import { parseAnalysisJson } from "@/lib/db-json";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** RFC 4180-style CSV field: quotes escaped, multiline allowed inside quotes. */
function esc(s: string) {
  const t = String(s).replace(/"/g, '""');
  return `"${t}"`;
}

function joinActionItems(items: string[]) {
  return items.map((x) => x.replace(/\s+/g, " ").trim()).join(" | ");
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const calls = await prisma.call.findMany({
    where: visibleCallsWhere(session),
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });

  const header = [
    "id",
    "createdAt",
    "ownerEmail",
    "overallScore",
    "customerScore",
    "sentiment",
    "talkRatioRepPct",
    "durationSeconds",
    "fileName",
    "summary",
    "transcript",
    "actionItems",
    "actionItemsCount",
    "positiveObservations",
    "negativeObservations",
  ].join(",");

  const rows = calls.map((c) => {
    const a = parseAnalysisJson(c.analysis);
    const pos = a.coachingNotes.positiveObservations.join(" | ");
    const neg = a.coachingNotes.negativeObservations.join(" | ");
    return [
      c.id,
      c.createdAt.toISOString(),
      esc(c.user.email),
      a.overallScore,
      a.customerSatisfactionScore,
      esc(a.sentiment.overall),
      a.talkRatioRepPct,
      c.durationSeconds,
      esc(c.fileName ?? ""),
      esc(a.summary),
      esc(c.transcript),
      esc(joinActionItems(a.actionItems)),
      a.actionItems.length,
      esc(pos),
      esc(neg),
    ].join(",");
  });

  // UTF-8 BOM helps Excel detect encoding for transcripts with smart quotes, etc.
  const csv = "\uFEFF" + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-calls-export-${Date.now()}.csv"`,
    },
  });
}
