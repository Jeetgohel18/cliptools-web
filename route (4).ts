// GET /api/media/:id/download?type=original — download the uploaded file
// GET /api/media/:id/download?file=out-….mp4 — download a finished export

import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { CONTENT_TYPES, MediaError, cleanupExpired, errorResponse, inputPath, readJob } from "../../../../lib/media";
import { outputPath, readExportStatus } from "../../../../lib/exports";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await cleanupExpired();
  try {
    const { id } = await params;
    const search = new URL(request.url).searchParams;
    const job = await readJob(id);
    const baseName = path.basename(job.originalName, path.extname(job.originalName)) || "cliptools";

    let file: string;
    let downloadName: string;
    if (search.get("type") === "original") {
      file = inputPath(job);
      downloadName = baseName + job.ext;
    } else if (search.get("file")) {
      const name = search.get("file")!;
      const status = await readExportStatus(id, name);
      if (status.status !== "done") {
        throw new MediaError("This file isn't ready yet.", 409);
      }
      file = outputPath(id, name);
      downloadName = `${baseName}-${status.suffix}${path.extname(name)}`;
    } else {
      throw new MediaError("Nothing to download was specified.", 400);
    }

    let size: number;
    try {
      size = (await fs.stat(file)).size;
    } catch {
      throw new MediaError("This file has expired or was deleted.", 404);
    }

    const ext = path.extname(downloadName);
    const asciiName = downloadName.replace(/[^\w .-]/g, "_");
    const stream = Readable.toWeb(createReadStream(file)) as unknown as ReadableStream;

    return new Response(stream, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Length": String(size),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
