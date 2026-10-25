// Replaced by /api/media/:id/export. Kept only so older copies of the page get a clear answer.
// You can safely delete this folder (app/api/media/[id]/mp3).

export function POST() {
  return Response.json({ error: "This endpoint was replaced. Please refresh the page." }, { status: 410 });
}
