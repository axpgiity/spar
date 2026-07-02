# Spar

Spar is a pass-device debate game: pick a motion, assign sides, run timed rounds, and get a scored result card.

## Local run

```bash
npm run dev
```

Open `http://localhost:4173`.

Without `ANTHROPIC_API_KEY`, local development uses a deterministic demo judge. In production, set `ANTHROPIC_API_KEY` so `/api/judge` can call Anthropic from the server.

## Launch resources

For v1, you do not need a database or a cloud instance. Deploy the static app plus `api/judge.js` as a serverless function, for example on Vercel.

Required:

- A hosting account that supports serverless functions.
- `ANTHROPIC_API_KEY` configured as an environment variable.

Add a database later for accounts, ranked history, saved debates, public leaderboards, moderation, or rooms.
