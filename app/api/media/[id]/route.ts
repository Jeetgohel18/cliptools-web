// DELETE /api/media/:id — stop any exports, then delete the upload and everything made from it.

import { cleanupExpired, deleteJob, errorResponse, jobDir } from "../../../lib/media";
import { cancelExports } from "../../../lib/exports";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await cleanupExpired();
  try {
    const { id } = await params;
    jobDir(id); // validates the id
    await cancelExports(id);
    await deleteJob(id);
    return Response.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
