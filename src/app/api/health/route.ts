import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Non-secret flags for the signed-in dashboard only (ops / demo readiness). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  return NextResponse.json({
    database,
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
  });
}
