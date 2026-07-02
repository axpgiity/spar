const MAX_TEXT = 12000;

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, Math.min(10, Math.round(number)));
}

function cleanText(value, limit = MAX_TEXT) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Invalid request.");
  const motion = cleanText(payload.motion, 500);
  if (motion.length < 8) throw new Error("Motion is too short.");
  if (!payload.sides || typeof payload.sides !== "object") throw new Error("Missing sides.");
  const sides = {
    AFF: cleanText(payload.sides.AFF, 80) || "For",
    NEG: cleanText(payload.sides.NEG, 80) || "Against"
  };
  const phases = Array.isArray(payload.phases) ? payload.phases.slice(0, 16) : [];
  const transcript = payload.transcript && typeof payload.transcript === "object" ? payload.transcript : {};
  return { motion, sides, phases, transcript };
}

function transcriptForPrompt(payload) {
  const fallbackLabels = {
    "open-aff": "FOR opening",
    "open-neg": "AGAINST opening",
    "reb-aff": "FOR rebuttal",
    "reb-neg": "AGAINST rebuttal",
    "cx-aff-ask": "FOR cross-ex question",
    "cx-neg-ans": "AGAINST cross-ex answer",
    "cx-neg-ask": "AGAINST cross-ex question",
    "cx-aff-ans": "FOR cross-ex answer",
    "close-aff": "FOR closing",
    "close-neg": "AGAINST closing"
  };

  return payload.phases
    .filter((phase) => !phase.private)
    .map((phase) => {
      const side = phase.side === "AFF" ? "FOR" : "AGAINST";
      const label = fallbackLabels[phase.id] || `${side} ${phase.label || "round"}`;
      const text = cleanText(payload.transcript[phase.id], 1800) || "[No notes captured]";
      return `${label}: ${text}`;
    })
    .join("\n\n")
    .slice(0, MAX_TEXT);
}

function buildPrompt(payload) {
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

function extractJson(text) {
  const stripped = String(text || "").replace(/```json|```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("Judge returned no JSON.");
  return JSON.parse(stripped.slice(start, end + 1));
}

function normalizeResult(raw) {
  const categories = ["logic", "evidence", "rebuttal", "crossExamination", "structure", "persuasiveness"];
  const result = {
    affirmative: { notes: cleanText(raw?.affirmative?.notes, 90) },
    negative: { notes: cleanText(raw?.negative?.notes, 90) },
    winner: raw?.winner === "negative" ? "negative" : "affirmative",
    verdict: cleanText(raw?.verdict, 420),
    shareLine: cleanText(raw?.shareLine, 100)
  };

  for (const key of categories) {
    result.affirmative[key] = clampScore(raw?.affirmative?.[key]);
    result.negative[key] = clampScore(raw?.negative?.[key]);
  }

  if (!result.verdict) result.verdict = "The winner did more work on clash, structure, and final comparison.";
  if (!result.shareLine) result.shareLine = result.winner === "affirmative" ? "For takes the table." : "Against takes the table.";
  return result;
}

function heuristicJudge(payload) {
  const affText = Object.entries(payload.transcript)
    .filter(([key]) => key.includes("aff"))
    .map(([, value]) => cleanText(value, 2000))
    .join(" ");
  const negText = Object.entries(payload.transcript)
    .filter(([key]) => key.includes("neg"))
    .map(([, value]) => cleanText(value, 2000))
    .join(" ");

  const scoreSide = (text) => {
    const words = text.split(/\s+/).filter(Boolean).length;
    const evidence = /\b(data|study|because|for example|evidence|research|percent|survey)\b/i.test(text) ? 2 : 0;
    const clash = /\b(they|opponent|rebut|however|but|therefore|because)\b/i.test(text) ? 1 : 0;
    const base = Math.min(8, 3 + Math.floor(words / 35) + evidence + clash);
    return {
      logic: base,
      evidence: Math.max(1, base - (evidence ? 1 : 3)),
      rebuttal: Math.max(1, base - 1 + clash),
      crossExamination: Math.max(1, base - 2),
      structure: Math.max(1, base - 1),
      persuasiveness: base,
      notes: words ? "Stronger captured material." : "Very little captured argument."
    };
  };

  const affirmative = scoreSide(affText);
  const negative = scoreSide(negText);
  const affTotal = Object.values(affirmative).filter(Number.isFinite).reduce((a, b) => a + b, 0);
  const negTotal = Object.values(negative).filter(Number.isFinite).reduce((a, b) => a + b, 0);
  const winner = affTotal >= negTotal ? "affirmative" : "negative";
  const winnerName = winner === "affirmative" ? payload.sides.AFF : payload.sides.NEG;

  return normalizeResult({
    affirmative,
    negative,
    winner,
    verdict: `${winnerName} wins on the captured record. The deciding edge was clearer structure and more developed argument work.`,
    shareLine: `${winnerName} wins the table.`
  });
}

async function judgeDebate(body) {
  const payload = validatePayload(body);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    if (process.env.SPAR_DEMO_JUDGE === "1" || process.env.NODE_ENV !== "production") {
      return { result: heuristicJudge(payload), demo: true };
    }
    const error = new Error("ANTHROPIC_API_KEY is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
      max_tokens: 900,
      temperature: 0.2,
      messages: [{ role: "user", content: buildPrompt(payload) }]
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || "AI judge request failed.");
    error.statusCode = response.status;
    throw error;
  }

  const textBlock = Array.isArray(data.content) ? data.content.find((block) => block.type === "text") : null;
  const raw = extractJson(textBlock?.text);
  return { result: normalizeResult(raw), demo: false };
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const result = await judgeDebate(req.body || {});
    send(res, 200, result);
  } catch (err) {
    send(res, err.statusCode || 400, { error: err.message || "Judge failed." });
  }
}

module.exports = handler;
module.exports.judgeDebate = judgeDebate;
