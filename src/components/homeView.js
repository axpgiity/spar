import { motions } from "../data/motions.js";
import { formats } from "../data/formats.js";
import { bind, html } from "../lib/dom.js";
import { topBar } from "./topBar.js";

export function homeView(root, gameState, store) {
  const selectedMotion = gameState.isCustomMotion
    ? { title: gameState.customMotion || "Type your own debate motion", type: "Custom", heat: "Live", angle: "Your table, your fight." }
    : motions.find((motion) => motion.id === gameState.motionId) || motions[0];
  const selectedFormat = formats[gameState.formatId] || formats.blitz;

  root.innerHTML = `
    <main class="gameShell homeShell">
      ${topBar("Fast debate game")}
      <section class="arcadeHome">
        <div class="heroScene gameCabinet">
          <div class="cabinetHud">
            <span>${html(selectedMotion.type)}</span>
            <strong>${html(selectedFormat.label)} / ${html(selectedFormat.length)}</strong>
          </div>
          <div class="heroText">
            <div class="eyebrow">Viral debate</div>
            <h1 data-live-motion-title>${html(selectedMotion.title)}</h1>
            <div class="heroMeta">
              <span>${html(selectedMotion.heat)}</span>
              <span>${html(selectedMotion.angle)}</span>
            </div>
          </div>
        </div>

        <div class="arcadePanel">
          <button class="megaPlayButton" data-action="startMatch">
            <span>Play now</span>
            <strong>${html(selectedFormat.vibe)}</strong>
          </button>

          <div class="quickActions">
            <button class="chunkButton" data-action="randomMotion">
              <span>New topic</span>
              <strong>Shuffle</strong>
            </button>
            <button class="chunkButton" data-action="customMotion">
              <span>Your fight</span>
              <strong>Custom</strong>
            </button>
          </div>

          <label class="gameInput keySlot">
            <span>Gemini key</span>
            <input data-field="geminiKey" type="password" value="${html(gameState.geminiKey || "")}" placeholder="Paste your key for AI judging">
          </label>

          ${gameState.isCustomMotion ? `
            <div class="customTray">
              <label class="gameInput">
                <span>Motion</span>
                <input data-field="customMotion" value="${html(gameState.customMotion)}" placeholder="Type the debate everyone is arguing about">
              </label>
            </div>
          ` : ""}

          <div class="arenaSelect" aria-label="Debate motions">
            ${motions.map((motion) => `
              <button class="arenaCard ${motion.id === gameState.motionId && !gameState.isCustomMotion ? "isActive" : ""}" data-motion-id="${html(motion.id)}">
                <span>${html(motion.type)} / ${html(motion.heat)}</span>
                <strong>${html(motion.title)}</strong>
                <em>${html(motion.angle)}</em>
              </button>
            `).join("")}
          </div>

          <div class="bottomDeck">
            <div class="modeDeck">
              ${Object.values(formats).map((format) => `
                <button class="modeTile ${format.id === gameState.formatId ? "isActive" : ""}" data-format-id="${html(format.id)}">
                  <span>${html(format.length)}</span>
                  <strong>${html(format.label)}</strong>
                  <em>${html(format.vibe)}</em>
                </button>
              `).join("")}
            </div>

            <details class="playerDrawer">
              <summary>Player names</summary>
              <div class="drawerGrid">
                <label class="gameInput">
                  <span>Player 1</span>
                  <input data-field="playerOne" value="${html(gameState.names.playerOne)}" placeholder="Player 1">
                </label>
                <label class="gameInput">
                  <span>Player 2</span>
                  <input data-field="playerTwo" value="${html(gameState.names.playerTwo)}" placeholder="Player 2">
                </label>
              </div>
            </details>
          </div>
        </div>
      </section>
    </main>
  `;

  bind(root, "[data-motion-id]", "click", (event) => {
    store.chooseMotion(event.currentTarget.dataset.motionId);
  });

  bind(root, "[data-format-id]", "click", (event) => {
    store.chooseFormat(event.currentTarget.dataset.formatId);
  });

  bind(root, "[data-action='randomMotion']", "click", () => {
    store.randomizeMotion();
  });

  bind(root, "[data-action='customMotion']", "click", () => {
    store.setCustomMotion(gameState.customMotion || "");
    store.chooseFormat(gameState.formatId);
  });

  bind(root, "[data-field='customMotion']", "input", (event) => {
    store.setCustomMotion(event.currentTarget.value);
    const heroTitle = root.querySelector("[data-live-motion-title]");
    if (heroTitle) heroTitle.textContent = event.currentTarget.value || "Type your own debate motion";
  });

  bind(root, "[data-field='playerOne']", "input", (event) => {
    store.setName("playerOne", event.currentTarget.value);
  });

  bind(root, "[data-field='playerTwo']", "input", (event) => {
    store.setName("playerTwo", event.currentTarget.value);
  });

  bind(root, "[data-field='geminiKey']", "input", (event) => {
    store.setGeminiKey(event.currentTarget.value);
  });

  bind(root, "[data-action='startMatch']", "click", () => {
    store.startMatch();
  });
}
