import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { visibleCallsWhere } from "@/lib/call-access";
import { prismaCallToSalesRecord } from "@/lib/db-call-mapper";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const calls = await prisma.call.findMany({
    where: visibleCallsWhere(session),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
    },
  });

  const items = calls.map((c) => ({
    ...prismaCallToSalesRecord(c),
    ownerEmail: c.user.email,
  }));

  return NextResponse.json({ calls: items });
}
