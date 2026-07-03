const rankingKey = "sparOfflineRankingsV1";

export function loadOfflineRankings() {
  try {
    return JSON.parse(localStorage.getItem(rankingKey) || "[]");
  } catch {
    return [];
  }
}

export function saveOfflineResult(gameState, result) {
  if (!result) return;

  const rankings = loadOfflineRankings();
  const winnerName = result.winner === "negative" ? gameState.players.neg : gameState.players.aff;
  const loserName = result.winner === "negative" ? gameState.players.aff : gameState.players.neg;
  const nextRankings = updatePlayer(updatePlayer(rankings, winnerName, true), loserName, false)
    .sort((firstPlayer, secondPlayer) => secondPlayer.rating - firstPlayer.rating)
    .slice(0, 25);

  localStorage.setItem(rankingKey, JSON.stringify(nextRankings));
}

function updatePlayer(rankings, name, didWin) {
  const cleanName = String(name || "Player").trim() || "Player";
  const existingPlayer = rankings.find((player) => player.name === cleanName);
  const player = existingPlayer || {
    name: cleanName,
    rating: 1000,
    wins: 0,
    losses: 0,
    games: 0
  };

  const nextPlayer = {
    ...player,
    rating: Math.max(100, player.rating + (didWin ? 24 : -16)),
    wins: player.wins + (didWin ? 1 : 0),
    losses: player.losses + (didWin ? 0 : 1),
    games: player.games + 1
  };

  return existingPlayer
    ? rankings.map((item) => item.name === cleanName ? nextPlayer : item)
    : [...rankings, nextPlayer];
}
