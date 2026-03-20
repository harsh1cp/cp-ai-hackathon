import { toFile } from "openai";
import { getOpenAI } from "@/lib/openai";
import type { TranscriptSegment } from "@/lib/sales-call-model";

const MAX_BYTES = 24 * 1024 * 1024;

export async function transcribeAudioBuffer(
  buf: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ transcript: string; segments: TranscriptSegment[] }> {
  if (buf.length > MAX_BYTES) {
    throw new Error("File too large (max ~24MB for Whisper)");
  }
  const uploadable = await toFile(buf, fileName, { type: mimeType });
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
    throw new Error("Empty transcription");
  }
  return { transcript: text, segments };
}
