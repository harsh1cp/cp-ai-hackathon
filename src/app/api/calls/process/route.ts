import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { processAudioAndSaveCall } from "@/lib/process-and-save-call";

export const runtime = "nodejs";
export const maxDuration = 300;

function line(obj: object): string {
  return `${JSON.stringify(obj)}\n`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll("audio").filter((x): x is File => x instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No audio files" }, { status: 400 });
  }

  let durations: number[] = [];
  const rawDur = form.get("durations");
  if (typeof rawDur === "string") {
    try {
      const parsed = JSON.parse(rawDur) as unknown;
      if (Array.isArray(parsed)) {
        durations = parsed.map((x) =>
          typeof x === "number" && Number.isFinite(x) ? x : 0
        );
      }
    } catch {
      durations = [];
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: object) => controller.enqueue(enc.encode(line(obj)));
      const total = files.length;
      let index = 0;
      for (const file of files) {
        index += 1;
        const name = file.name || `recording-${index}.webm`;
        const mime = file.type || "audio/webm";
        const durationSeconds = durations[index - 1] ?? 0;
        send({
          type: "file_start",
          index,
          total,
          name,
        });
        send({
          type: "progress",
          step: "transcribing",
          index,
          name,
        });
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          send({
            type: "progress",
            step: "analyzing",
            index,
            name,
          });
          const result = await processAudioAndSaveCall({
            userId: session.sub,
            buffer,
            fileName: name,
            mimeType: mime,
            durationSeconds,
          });
          send({
            type: "call_saved",
            index,
            callId: result.callId,
            name,
          });
        } catch (e) {
          send({
            type: "error",
            index,
            name,
            message: e instanceof Error ? e.message : "Processing failed",
          });
        }
      }
      send({ type: "complete", total });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
