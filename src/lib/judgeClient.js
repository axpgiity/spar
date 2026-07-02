import { createDemoResult } from "./demoJudge.js";

export async function judgeGame(gameState) {
  try {
    const response = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motion: gameState.motion.title,
        sides: {
          AFF: gameState.players.aff,
          NEG: gameState.players.neg
        },
        phases: gameState.rounds.map((round) => ({
          id: round.id,
          side: round.side === "aff" ? "AFF" : "NEG",
          label: round.label,
          private: round.isPrivate
        })),
        transcript: gameState.notes
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.result) throw new Error(payload.error || "Judge unavailable");
    return payload.result;
  } catch {
    return createDemoResult(gameState);
  }
}
