export function formatFaceIdentity({
  boardName,
  faceLabel,
  boardCode,
}: {
  boardName?: string | null;
  faceLabel?: string | null;
  boardCode?: string | null;
}): string {
  const board = (boardName ?? "").trim() || (boardCode ?? "").trim();
  const face = (faceLabel ?? "").trim();
  if (board && face) return `${board} · ${face}`;
  if (board) return board;
  if (face) return face;
  return "Unnamed face";
}
