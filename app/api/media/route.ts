// POST /api/media — upload a video you own. The file is validated with FFprobe.
// The browser sends the raw file (not a form), so it streams straight to disk
// instead of being held in memory: important on small free servers.

import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { MAX_DURATION_MINUTES } from "../../lib/exportOptions";
import {
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  MediaError,
  checkUploadRate,
  cleanupExpired,
  createJobDir,
  deleteJob,
  errorResponse,
  probeVideo,
  publicJob,
  saveJob,
  type Job,
} from "../../lib/media";

const tooLarge = () => new MediaError(`This file is too large. The maximum size is ${MAX_UPLOAD_MB} MB.`, 413);

export async function POST(request: Request) {
  await cleanupExpired();

  try {
    if (request.headers.get("x-rights-confirmed") !== "yes") {
      throw new MediaError("Please confirm that you own this video or have permission to process it.", 400);
    }

    let fileName: string;
    try {
      fileName = path.basename(decodeURIComponent(request.headers.get("x-file-name") ?? "")).slice(0, 200);
    } catch {
      throw new MediaError("Invalid file name.", 400);
    }
    const ext = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new MediaError(`Unsupported file type. Please upload one of: ${ALLOWED_EXTENSIONS.join(", ")}.`, 415);
    }

    const declaredSize = Number(request.headers.get("content-length") || 0);
    if (declaredSize > MAX_UPLOAD_BYTES) throw tooLarge();
    if (!request.body) throw new MediaError("No file was received.", 400);

    checkUploadRate(request);

    const { id, dir } = await createJobDir();
    try {
      const input = path.join(dir, "input" + ext);
      let size = 0;
      // Stops the upload as soon as it goes over the limit, even if the size header lied
      const limit = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          size += chunk.length;
          callback(size > MAX_UPLOAD_BYTES ? tooLarge() : null, chunk);
        },
      });
      await pipeline(Readable.fromWeb(request.body as unknown as NodeReadableStream), limit, createWriteStream(input));
      if (size === 0) throw new MediaError("This file is empty.", 400);

      const info = await probeVideo(input);
      if (info.durationSec !== null && info.durationSec > MAX_DURATION_MINUTES * 60) {
        throw new MediaError(`This video is too long. The maximum length is ${MAX_DURATION_MINUTES} minutes.`, 413);
      }

      const job: Job = { id, originalName: fileName, ext, size, createdAt: Date.now(), ...info };
      await saveJob(job);
      return Response.json(publicJob(job), { status: 201 });
    } catch (error) {
      await deleteJob(id); // never leave half-processed files behind
      if (error instanceof MediaError) throw error;
      throw new MediaError("The upload was interrupted. Please try again.", 400);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
