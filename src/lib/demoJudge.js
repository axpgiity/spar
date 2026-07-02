const categories = ["logic", "evidence", "rebuttal", "crossExamination", "structure", "persuasiveness"];

export function createDemoResult(gameState) {
  const affText = collectText(gameState, "aff");
  const negText = collectText(gameState, "neg");
  const affirmative = scoreText(affText);
  const negative = scoreText(negText);
  const winner = totalScore(affirmative) >= totalScore(negative) ? "affirmative" : "negative";
  const winnerName = winner === "affirmative" ? gameState.players.aff : gameState.players.neg;

  return {
    affirmative,
    negative,
    winner,
    verdict: `Demo judge: ${winnerName} wins on the captured record. The edge came from clearer structure and more developed argument work.`,
    shareLine: `${winnerName} wins the table.`
  };
}

function collectText(gameState, side) {
  return gameState.rounds
    .filter((round) => round.side === side)
    .map((round) => gameState.notes[round.id] || "")
    .join(" ");
}

function scoreText(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const hasEvidence = /\b(data|study|because|example|evidence|research|percent|survey)\b/i.test(text);
  const hasClash = /\b(they|opponent|rebut|however|but|therefore|because)\b/i.test(text);
  const base = Math.max(1, Math.min(8, 3 + Math.floor(words / 34) + (hasEvidence ? 2 : 0) + (hasClash ? 1 : 0)));

  return {
    logic: base,
    evidence: Math.max(1, base - (hasEvidence ? 1 : 3)),
    rebuttal: Math.max(1, base - 1 + (hasClash ? 1 : 0)),
    crossExamination: Math.max(1, base - 2),
    structure: Math.max(1, base - 1),
    persuasiveness: base,
    notes: words ? "Stronger captured material." : "Very little captured argument."
  };
}

function totalScore(sideScore) {
  return categories.reduce((sum, key) => sum + Number(sideScore[key] || 0), 0);
}
