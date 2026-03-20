import { NextResponse } from "next/server";
import { toFile } from "openai";
import { getOpenAI } from "@/lib/openai";
import type { TranscriptSegment } from "@/lib/sales-call-model";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 24 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("audio");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing audio file (field name: audio)" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max ~24MB for Whisper)" },
        { status: 413 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const name =
      file instanceof File && file.name ? file.name : "recording.webm";
    const type = file.type || "audio/webm";

    const uploadable = await toFile(buf, name, { type });

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file: uploadable,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    const tv = transcription as {
      text?: string;
      segments?: Array<{ start: number; end: number; text: string }>;
    };

    const text = tv.text?.trim() ?? "";

    const segments: TranscriptSegment[] = (tv.segments ?? []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));

    if (!text) {
      return NextResponse.json(
        { error: "Empty transcription" },
        { status: 502 }
      );
    }

    return NextResponse.json({ transcript: text, segments });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription failed";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("API key")
        ? 500
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
