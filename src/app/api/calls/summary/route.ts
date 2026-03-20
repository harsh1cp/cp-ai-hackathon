import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { visibleCallsWhere } from "@/lib/call-access";
import { parseAnalysisJson } from "@/lib/db-json";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const calls = await prisma.call.findMany({
    where: visibleCallsWhere(session),
    select: { durationSeconds: true, analysis: true },
  });

  const n = calls.length;
  if (n === 0) {
    return NextResponse.json({
      totalCalls: 0,
      avgScore: 0,
      avgDurationSeconds: 0,
      actionItemsCount: 0,
      sentimentMix: { positivePct: 0, neutralPct: 0, negativePct: 0 },
    });
  }

  let scoreSum = 0;
  let durSum = 0;
  let actions = 0;
  let p = 0;
  let neu = 0;
  let neg = 0;

  for (const c of calls) {
    const a = parseAnalysisJson(c.analysis);
    scoreSum += a.overallScore;
    durSum += c.durationSeconds;
    actions += a.actionItems.length;
    p += a.sentiment.positivePct;
    neu += a.sentiment.neutralPct;
    neg += a.sentiment.negativePct;
  }

  return NextResponse.json({
    totalCalls: n,
    avgScore: Math.round((scoreSum / n) * 10) / 10,
    avgDurationSeconds: Math.round(durSum / n),
    actionItemsCount: actions,
    sentimentMix: {
      positivePct: Math.round((p / n) * 10) / 10,
      neutralPct: Math.round((neu / n) * 10) / 10,
      negativePct: Math.round((neg / n) * 10) / 10,
    },
  });
}
