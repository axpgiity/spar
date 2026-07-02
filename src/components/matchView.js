import { bind, html } from "../lib/dom.js";
import { formatTime, roundProgress } from "../lib/time.js";
import { topBar } from "./topBar.js";

export function matchView(root, gameState, store) {
  const round = gameState.rounds[gameState.roundIndex];
  const activePlayer = round.side === "aff" ? gameState.players.aff : gameState.players.neg;
  const progress = roundProgress(round);
  const ringValue = 326 * (1 - progress);

  root.innerHTML = `
    <main class="gameShell matchShell">
      ${topBar(`Round ${gameState.roundIndex + 1}/${gameState.rounds.length}`)}
      <section class="matchLayout">
        <aside class="scoreSide">
          <div class="motionCard">
            <span class="eyebrow">Motion</span>
            <h1>${html(gameState.motion.title)}</h1>
            <p>${html(gameState.motion.angle)}</p>
          </div>
          <div class="versusCard">
            ${playerCard("For", gameState.players.aff, round.side === "aff", "aff")}
            <div class="versusLine">VS</div>
            ${playerCard("Against", gameState.players.neg, round.side === "neg", "neg")}
          </div>
        </aside>

        <section class="playSurface">
          <div class="roundTrack">
            ${gameState.rounds.map((item, index) => `
              <span class="roundDot ${index < gameState.roundIndex ? "isDone" : ""} ${index === gameState.roundIndex ? "isCurrent" : ""}" title="${html(item.label)}"></span>
            `).join("")}
          </div>

          <div class="clockCard ${round.side === "aff" ? "affGlow" : "negGlow"}">
            <svg class="clockRing" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52"></circle>
              <circle class="clockValue" cx="60" cy="60" r="52" style="stroke-dashoffset:${ringValue}"></circle>
            </svg>
            <div class="clockText">
              <span>${html(round.label)}</span>
              <strong>${formatTime(round.timeLeft)}</strong>
              <em>${html(activePlayer)} speaking</em>
            </div>
          </div>

          <div class="promptCard">
            <span>${round.isPrivate ? "Private prep" : "Live round"}</span>
            <h2>${html(round.prompt)}</h2>
          </div>

          <label class="speechPad">
            <span>Capture the strongest lines</span>
            <textarea data-field="roundNote" placeholder="Type key claims, receipts, and turns here...">${html(gameState.notes[round.id] || "")}</textarea>
          </label>

          <div class="matchActions">
            <button class="ghostButton" data-action="pause">${gameState.isPaused ? "Resume" : "Pause"}</button>
            <button class="primaryButton" data-action="nextRound">${gameState.roundIndex === gameState.rounds.length - 1 ? "Judge match" : "Pass device"}</button>
          </div>
        </section>
      </section>
    </main>
  `;

  bind(root, "[data-field='roundNote']", "input", (event) => {
    store.saveNote(round.id, event.currentTarget.value);
  });

  bind(root, "[data-action='pause']", "click", () => {
    store.togglePause();
  });

  bind(root, "[data-action='nextRound']", "click", () => {
    store.nextRound();
  });
}

function playerCard(label, name, isActive, side) {
  return `
    <div class="playerCard ${isActive ? "isActive" : ""} ${side}">
      <span>${label}</span>
      <strong>${html(name)}</strong>
    </div>
  `;
}
