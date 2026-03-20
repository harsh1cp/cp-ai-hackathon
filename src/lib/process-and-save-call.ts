import type { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import { runExtendedSalesCallAnalysis } from "@/lib/ai-analyzer";
import {
  localCallAudioPublicPath,
  writeLocalCallAudio,
} from "@/lib/local-call-audio";
import { prisma } from "@/lib/prisma";
import type { TranscriptSegment } from "@/lib/sales-call-model";
import { transcribeAudioBuffer } from "@/lib/transcribe-buffer";

export type ProcessCallResult = {
  callId: string;
  transcript: string;
  segments: TranscriptSegment[];
};

export async function processAudioAndSaveCall(options: {
  userId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  durationSeconds: number;
}): Promise<ProcessCallResult> {
  const { transcript, segments } = await transcribeAudioBuffer(
    options.buffer,
    options.fileName,
    options.mimeType
  );

  const analysis = await runExtendedSalesCallAnalysis(
    transcript,
    options.durationSeconds
  );

  let audioUrl: string | null = null;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const key = `calls/${options.userId}/${Date.now()}-${options.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const blob = await put(key, options.buffer, {
        access: "public",
        token,
        contentType: options.mimeType || "application/octet-stream",
      });
      audioUrl = blob.url;
    } catch {
      audioUrl = null;
    }
  }

  const call = await prisma.call.create({
    data: {
      userId: options.userId,
      transcript,
      durationSeconds: options.durationSeconds,
      segments: segments as Prisma.InputJsonValue,
      analysis: analysis as Prisma.InputJsonValue,
      audioUrl,
      fileName: options.fileName,
      mimeType: options.mimeType,
    },
  });

  if (!audioUrl) {
    const saved = await writeLocalCallAudio(call.id, options.buffer);
    if (saved) {
      await prisma.call.update({
        where: { id: call.id },
        data: { audioUrl: localCallAudioPublicPath(call.id) },
      });
    } else {
      console.error(
        "[process-and-save-call] Local audio write failed; client IndexedDB mirror may still work after upload."
      );
    }
  }

  return { callId: call.id, transcript, segments };
}
