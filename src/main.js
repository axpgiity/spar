import { createStore } from "./state/gameStore.js";
import { renderApp } from "./components/appView.js";

const appRoot = document.getElementById("appRoot");
const store = createStore();

function paint() {
  renderApp(appRoot, store);
}

store.subscribe(paint);
paint();
