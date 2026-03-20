import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getCallIfAccessible } from "@/lib/call-access";
import { prismaCallToSalesRecord } from "@/lib/db-call-mapper";
import type { Prisma } from "@prisma/client";
import { parseAnalysisJson } from "@/lib/db-json";
import type { ExtendedSalesCallAnalysis } from "@/lib/sales-call-model";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const call = await getCallIfAccessible(id, session);
  if (!call) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const record = prismaCallToSalesRecord(call);
  return NextResponse.json({
    call: {
      ...record,
      audioUrl: call.audioUrl,
      ownerEmail: call.user.email,
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getCallIfAccessible(id, session);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json()) as {
    followUpActions?: Partial<ExtendedSalesCallAnalysis["followUpActions"]>;
  };

  const analysis = parseAnalysisJson(existing.analysis);
  if (body.followUpActions) {
    analysis.followUpActions = {
      ...analysis.followUpActions,
      ...body.followUpActions,
    };
  }

  await prisma.call.update({
    where: { id },
    data: { analysis: analysis as Prisma.InputJsonValue },
  });

  const updated = await prisma.call.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({
    call: {
      ...prismaCallToSalesRecord(updated),
      audioUrl: updated.audioUrl,
      ownerEmail: existing.user.email,
    },
  });
}
