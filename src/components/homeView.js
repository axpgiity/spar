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
          <nav class="gameTabs" aria-label="Game sections">
            ${tabButton("play", "Play", gameState.homeTab)}
            ${tabButton("topics", "Topics", gameState.homeTab)}
            ${tabButton("ranks", "Ranks", gameState.homeTab)}
            ${tabButton("settings", "Settings", gameState.homeTab)}
          </nav>

          <div class="tabStage">
            ${renderTab(gameState, selectedFormat)}
          </div>
        </div>
      </section>
    </main>
  `;

  bind(root, "[data-tab-id]", "click", (event) => {
    store.setHomeTab(event.currentTarget.dataset.tabId);
  });

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

function tabButton(tabId, label, activeTab) {
  return `
    <button class="tabButton ${activeTab === tabId ? "isActive" : ""}" data-tab-id="${html(tabId)}">
      ${html(label)}
    </button>
  `;
}

function renderTab(gameState, selectedFormat) {
  if (gameState.homeTab === "topics") return renderTopicsTab(gameState);
  if (gameState.homeTab === "ranks") return renderRanksTab(gameState);
  if (gameState.homeTab === "settings") return renderSettingsTab(gameState);
  return renderPlayTab(gameState, selectedFormat);
}

function renderPlayTab(gameState, selectedFormat) {
  return `
    <button class="megaPlayButton" data-action="startMatch">
      <span>Play</span>
      <strong>${html(selectedFormat.label)} / ${html(selectedFormat.length)}</strong>
    </button>
    <div class="quickActions">
      <button class="chunkButton" data-action="randomMotion">
        <span>Topic</span>
        <strong>Shuffle</strong>
      </button>
      <button class="chunkButton" data-action="customMotion">
        <span>Motion</span>
        <strong>Custom</strong>
      </button>
    </div>
    <div class="modeDeck">
      ${Object.values(formats).map((format) => `
        <button class="modeTile ${format.id === gameState.formatId ? "isActive" : ""}" data-format-id="${html(format.id)}">
          <span>${html(format.length)}</span>
          <strong>${html(format.label)}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function renderTopicsTab(gameState) {
  return `
    ${gameState.isCustomMotion ? `
      <div class="customTray">
        <label class="gameInput">
          <span>Motion</span>
          <input data-field="customMotion" value="${html(gameState.customMotion)}" placeholder="Type a custom motion">
        </label>
      </div>
    ` : ""}
    <div class="arenaSelect compactTopics" aria-label="Debate motions">
      ${motions.map((motion) => `
        <button class="arenaCard ${motion.id === gameState.motionId && !gameState.isCustomMotion ? "isActive" : ""}" data-motion-id="${html(motion.id)}">
          <span>${html(motion.type)}</span>
          <strong>${html(motion.title)}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function renderRanksTab(gameState) {
  const rankings = gameState.offlineRankings || [];
  return `
    <div class="rankSwitch">
      <span class="isActive">Offline</span>
      <span>Online soon</span>
    </div>
    <div class="rankList">
      ${rankings.length ? rankings.map((player, index) => `
        <div class="rankRow">
          <b>${index + 1}</b>
          <strong>${html(player.name)}</strong>
          <span>${html(player.rating)}</span>
        </div>
      `).join("") : `
        <div class="emptyState">Play a match to seed local ranks.</div>
      `}
    </div>
  `;
}

function renderSettingsTab(gameState) {
  return `
    <label class="gameInput keySlot">
      <span>Gemini key</span>
      <input data-field="geminiKey" type="password" value="${html(gameState.geminiKey || "")}" placeholder="AI judging key">
    </label>
    <details class="playerDrawer" open>
      <summary>Players</summary>
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
  `;
}
