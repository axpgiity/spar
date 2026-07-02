export function formatTime(totalSeconds) {
  const safeTotal = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeTotal / 60);
  const seconds = String(safeTotal % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function roundProgress(round) {
  if (!round || round.duration <= 0) return 0;
  return Math.max(0, Math.min(1, round.timeLeft / round.duration));
}
