// POST   /api/media/:id/export — add a video or audio export to the queue
// GET    /api/media/:id/export?file=… — check an export's progress
// DELETE /api/media/:id/export?file=… — cancel an export

import { MediaError, cleanupExpired, errorResponse, jobDir, readJob } from "../../../../lib/media";
import { cancelExports, parseExportOptions, readExportStatus, startExport, type ExportStatus } from "../../../../lib/exports";

function withUrl(id: string, status: ExportStatus) {
  return {
    ...status,
    downloadUrl: status.status === "done" ? `/api/media/${id}/download?file=${status.file}` : null,
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await cleanupExpired();
  try {
    const { id } = await params;
    const job = await readJob(id);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new MediaError("Invalid export request.", 400);
    }

    const status = await startExport(job, parseExportOptions(body, job));
    return Response.json(withUrl(id, status), { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await readJob(id);
    const file = new URL(request.url).searchParams.get("file") ?? "";
    return Response.json(withUrl(id, await readExportStatus(id, file)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    jobDir(id); // validates the id
    const file = new URL(request.url).searchParams.get("file") ?? "";
    await readExportStatus(id, file); // validates the file name
    await cancelExports(id, file);
    return Response.json({ cancelled: true });
  } catch (error) {
    return errorResponse(error);
  }
}
