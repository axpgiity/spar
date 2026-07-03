import { createDemoResult } from "./demoJudge.js";

const resultKeys = ["logic", "evidence", "rebuttal", "crossExamination", "structure", "persuasiveness"];

export async function judgeGame(gameState) {
  if (gameState.geminiKey?.trim()) {
    try {
      return await judgeWithGemini(gameState, gameState.geminiKey.trim());
    } catch {
      return createDemoResult(gameState);
    }
  }

  try {
    const response = await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createJudgePayload(gameState))
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.result) throw new Error(payload.error || "Judge unavailable");
    return payload.result;
  } catch {
    return createDemoResult(gameState);
  }
}

async function judgeWithGemini(gameState, apiKey) {
  const model = "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildJudgePrompt(createJudgePayload(gameState))
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Gemini unavailable");
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  return normalizeResult(JSON.parse(stripJson(text)));
}

function createJudgePayload(gameState) {
  return {
    motion: gameState.motion.title,
    sides: {
      AFF: gameState.players.aff,
      NEG: gameState.players.neg
    },
    phases: gameState.rounds.map((round) => ({
      id: round.id,
      side: round.side === "aff" ? "AFF" : "NEG",
      label: round.label,
      private: round.isPrivate
    })),
    transcript: gameState.notes
  };
}

function buildJudgePrompt(payload) {
  return `You are the neutral judge for a timed debate game called Spar.

Judge argument quality only. Do not reward a side because you personally agree with it.
Prefer clear claims, direct clash, warranted reasoning, useful evidence, responsive cross-examination, and organized closing comparison.

Motion: "${payload.motion}"
For player: ${payload.sides.AFF}
Against player: ${payload.sides.NEG}

Transcript:
${transcriptForPrompt(payload)}

Return ONLY raw JSON in this exact shape:
{"affirmative":{"logic":0,"evidence":0,"rebuttal":0,"crossExamination":0,"structure":0,"persuasiveness":0,"notes":""},"negative":{"logic":0,"evidence":0,"rebuttal":0,"crossExamination":0,"structure":0,"persuasiveness":0,"notes":""},"winner":"affirmative","verdict":"","shareLine":""}

Rules:
- Scores are integers from 1 to 10.
- winner must be "affirmative" or "negative".
- notes per side must be under 12 words.
- verdict must be 1 or 2 sentences.
- shareLine must be under 100 characters and suitable for a result card.`;
}

function transcriptForPrompt(payload) {
  return payload.phases
    .filter((phase) => !phase.private)
    .map((phase) => {
      const side = phase.side === "AFF" ? "FOR" : "AGAINST";
      const text = String(payload.transcript[phase.id] || "").trim() || "[No notes captured]";
      return `${side} ${phase.label}: ${text}`;
    })
    .join("\n\n")
    .slice(0, 12000);
}

function normalizeResult(raw) {
  const result = {
    affirmative: { notes: cleanText(raw?.affirmative?.notes, 90) },
    negative: { notes: cleanText(raw?.negative?.notes, 90) },
    winner: raw?.winner === "negative" ? "negative" : "affirmative",
    verdict: cleanText(raw?.verdict, 420),
    shareLine: cleanText(raw?.shareLine, 100)
  };

  for (const key of resultKeys) {
    result.affirmative[key] = clampScore(raw?.affirmative?.[key]);
    result.negative[key] = clampScore(raw?.negative?.[key]);
  }

  if (!result.verdict) result.verdict = "The winner did more work on clash, structure, and final comparison.";
  if (!result.shareLine) result.shareLine = result.winner === "affirmative" ? "For takes the table." : "Against takes the table.";
  return result;
}

function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 1;
  return Math.max(1, Math.min(10, Math.round(score)));
}

function cleanText(value, limit) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function stripJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON returned");
  return clean.slice(start, end + 1);
}
