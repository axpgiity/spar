import { homeView } from "./homeView.js";
import { matchView } from "./matchView.js";
import { judgingView } from "./judgingView.js";
import { resultView } from "./resultView.js";

export function renderApp(root, store) {
  const gameState = store.getState();

  if (gameState.screen === "match") {
    matchView(root, gameState, store);
  } else if (gameState.screen === "judging") {
    judgingView(root, gameState, store);
  } else if (gameState.screen === "results") {
    resultView(root, gameState, store);
  } else {
    homeView(root, gameState, store);
  }

  store.afterRender();
}
