const storageKey = "sparGameStateV2";

export function loadSavedGame() {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function saveGame(gameState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(gameState));
  } catch {
    // Storage can fail in private mode. The game still works without persistence.
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Nothing to clear.
  }
}
