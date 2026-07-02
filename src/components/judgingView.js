import { topBar } from "./topBar.js";

export function judgingView(root) {
  root.innerHTML = `
    <main class="gameShell judgingShell">
      ${topBar("Judging")}
      <section class="judgingPanel">
        <div class="pulseOrb"></div>
        <h1>Scoring the clash.</h1>
        <p>Logic, evidence, rebuttal, cross-ex, structure, persuasion.</p>
      </section>
    </main>
  `;
}
