# Spar

Spar is a fast pass-device debate game: pick a motion, assign sides, run timed rounds, and get a scored result card.

The frontend is a native ES module app split into `src/components`, `src/data`, `src/lib`, `src/state`, and `src/styles`. It intentionally avoids a heavy framework runtime so the first load stays quick.

## Local run

```bash
npm run dev
```

Open `http://localhost:4173`.

Without `ANTHROPIC_API_KEY`, local development uses a deterministic demo judge. Static hosting, such as GitHub Pages, also falls back to the browser demo judge when `/api/judge` is unavailable.

For the GitHub Pages version, players can paste their own Gemini key in the UI for AI judging. The key is kept in memory for that browser session and is not saved to localStorage.

In production on serverless hosting, set `GEMINI_API_KEY` for server-side Gemini judging.

## Launch resources

For v1, you do not need a database or a cloud instance. Deploy the static app plus `api/judge.js` as a serverless function, for example on Vercel.

Required:

- A hosting account that supports serverless functions.
- `ANTHROPIC_API_KEY` configured as an environment variable.

Add a database later for accounts, ranked history, saved debates, public leaderboards, moderation, or rooms.
