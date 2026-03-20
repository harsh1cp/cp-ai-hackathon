import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { getCallIfAccessible } from "@/lib/call-access";
import {
  localCallAudioPublicPath,
  readLocalCallAudio,
} from "@/lib/local-call-audio";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const call = await getCallIfAccessible(id, session);
  if (!call) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (call.audioUrl !== localCallAudioPublicPath(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buf = await readLocalCallAudio(id);
  if (!buf) {
    return new NextResponse("Not found", { status: 404 });
  }

  const type = call.mimeType || "application/octet-stream";
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
