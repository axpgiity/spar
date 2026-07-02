import { html } from "../lib/dom.js";

export function topBar(label = "Live table") {
  return `
    <header class="topBar">
      <button class="brandButton" data-action="home" aria-label="Spar home">
        <span class="brandMark">SP</span>
        <span class="brandName">SPAR</span>
      </button>
      <span class="statusPill">${html(label)}</span>
    </header>
  `;
}
