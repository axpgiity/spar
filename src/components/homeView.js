import { motions } from "../data/motions.js";
import { formats } from "../data/formats.js";
import { bind, html } from "../lib/dom.js";
import { topBar } from "./topBar.js";

export function homeView(root, gameState, store) {
  const selectedMotion = gameState.isCustomMotion
    ? { title: gameState.customMotion || "Type your own debate motion", type: "Custom", heat: "Live", angle: "Your table, your fight." }
    : motions.find((motion) => motion.id === gameState.motionId) || motions[0];

  root.innerHTML = `
    <main class="gameShell homeShell">
      ${topBar("Fast debate game")}
      <section class="heroBoard">
        <div class="heroScene">
          <div class="heroText">
            <div class="eyebrow">Viral debate</div>
            <h1 data-live-motion-title>${html(selectedMotion.title)}</h1>
            <div class="heroMeta">
              <span>${html(selectedMotion.type)}</span>
              <span>${html(selectedMotion.heat)}</span>
            </div>
          </div>
        </div>

        <div class="launchDock">
          <div class="dockHeader">
            <div>
              <p class="dockLabel">Choose the table</p>
              <h2>Tap in. Argue fast. Share the card.</h2>
            </div>
            <button class="primaryButton startButton" data-action="startMatch">Start match</button>
          </div>

          <div class="motionRail" aria-label="Debate motions">
            ${motions.map((motion) => `
              <button class="motionChip ${motion.id === gameState.motionId && !gameState.isCustomMotion ? "isActive" : ""}" data-motion-id="${html(motion.id)}">
                <span>${html(motion.type)}</span>
                <strong>${html(motion.title)}</strong>
              </button>
            `).join("")}
          </div>

          <div class="playGrid">
            <section class="controlPanel">
              <p class="dockLabel">Custom motion</p>
              <label class="glassInput">
                <span>Debate this</span>
                <input data-field="customMotion" value="${html(gameState.customMotion)}" placeholder="e.g. Can 100 humans defeat a gorilla?">
              </label>
            </section>

            <section class="controlPanel">
              <p class="dockLabel">Players</p>
              <div class="playerGrid">
                <label class="glassInput">
                  <span>Player 1</span>
                  <input data-field="playerOne" value="${html(gameState.names.playerOne)}" placeholder="Priya">
                </label>
                <label class="glassInput">
                  <span>Player 2</span>
                  <input data-field="playerTwo" value="${html(gameState.names.playerTwo)}" placeholder="Sam">
                </label>
              </div>
            </section>

            <section class="controlPanel">
              <p class="dockLabel">Mode</p>
              <div class="modeSwitch">
                ${Object.values(formats).map((format) => `
                  <button class="modeCard ${format.id === gameState.formatId ? "isActive" : ""}" data-format-id="${html(format.id)}">
                    <strong>${html(format.label)}</strong>
                    <span>${html(format.length)} - ${html(format.vibe)}</span>
                  </button>
                `).join("")}
              </div>
            </section>
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

  bind(root, "[data-action='startMatch']", "click", () => {
    store.startMatch();
  });
}
