import fs from "fs/promises";
import path from "path";

const DIR = path.join(process.cwd(), "uploads", "calls");

export function localCallAudioPublicPath(callId: string): string {
  return `/api/calls/${callId}/audio`;
}

export function localCallAudioFilePath(callId: string): string {
  return path.join(DIR, callId);
}

/** Persist raw bytes for playback without Vercel Blob (dev / self-hosted). */
export async function writeLocalCallAudio(
  callId: string,
  buffer: Buffer
): Promise<boolean> {
  try {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(localCallAudioFilePath(callId), buffer);
    return true;
  } catch (e) {
    console.error(
      "[local-call-audio] Failed to write uploads/calls/",
      callId,
      e
    );
    return false;
  }
}

export async function readLocalCallAudio(callId: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(localCallAudioFilePath(callId));
  } catch {
    return null;
  }
}
