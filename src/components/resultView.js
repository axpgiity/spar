import { bind, html } from "../lib/dom.js";
import { topBar } from "./topBar.js";

const resultKeys = ["logic", "evidence", "rebuttal", "crossExamination", "structure", "persuasiveness"];

export function resultView(root, gameState, store) {
  const result = gameState.result;
  const winnerIsAff = result?.winner !== "negative";
  const winnerName = winnerIsAff ? gameState.players.aff : gameState.players.neg;

  root.innerHTML = `
    <main class="gameShell resultShell">
      ${topBar("Final card")}
      <section class="resultCard" id="resultCard">
        <div class="resultHero">
          <span class="eyebrow">${html(gameState.motion.title)}</span>
          <h1>${html(result?.shareLine || `${winnerName} wins the table.`)}</h1>
          <div class="winnerBadge">${winnerIsAff ? "For wins" : "Against wins"}</div>
          <strong>${html(winnerName)}</strong>
          <p>${html(result?.verdict || "")}</p>
        </div>

        <div class="scoreRows">
          ${resultKeys.map((key) => scoreRow(key, result)).join("")}
        </div>

        <div class="noteGrid">
          <div><span>For</span>${html(result?.affirmative?.notes || "")}</div>
          <div><span>Against</span>${html(result?.negative?.notes || "")}</div>
        </div>
      </section>

      <div class="resultActions">
        <button class="primaryButton" data-action="copyResult">Copy result</button>
        <button class="ghostButton" data-action="newMatch">New match</button>
      </div>
    </main>
  `;

  bind(root, "[data-action='newMatch']", "click", () => {
    store.resetMatch();
  });

  bind(root, "[data-action='copyResult']", "click", async () => {
    const text = `${result.shareLine}\n\n${result.verdict}\n\n${gameState.motion.title}\nSettled on Spar.`;
    await navigator.clipboard.writeText(text).catch(() => {});
  });
}

function scoreRow(key, result) {
  const label = key === "crossExamination" ? "cross" : key;
  const affScore = Number(result?.affirmative?.[key] || 0);
  const negScore = Number(result?.negative?.[key] || 0);

  return `
    <div class="scoreRow">
      <span>${html(label)}</span>
      <div class="scoreBar">
        <i style="width:${affScore * 10}%"></i>
        <b style="width:${negScore * 10}%"></b>
      </div>
      <strong>${affScore}-${negScore}</strong>
    </div>
  `;
}
