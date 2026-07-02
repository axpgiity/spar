export function createRounds(format) {
  const duration = format.durations;

  return [
    createRound("prepAff", "aff", "Prep", "Build your case. Private notes only.", duration.prep, true),
    createRound("prepNeg", "neg", "Prep", "Build your case. Private notes only.", duration.prep, true),
    createRound("openAff", "aff", "Opening", "Make the strongest case for the motion.", duration.opening, false),
    createRound("openNeg", "neg", "Opening", "Make the strongest case against the motion.", duration.opening, false),
    createRound("rebutAff", "aff", "Rebuttal", "Hit their best point, then rebuild yours.", duration.rebuttal, false),
    createRound("rebutNeg", "neg", "Rebuttal", "Hit their best point, then rebuild yours.", duration.rebuttal, false),
    createRound("askAff", "aff", "Cross ask", "Ask one sharp question. Make it answerable.", duration.crossAsk, false),
    createRound("answerNeg", "neg", "Cross answer", "Answer directly, then turn the point.", duration.crossAnswer, false),
    createRound("askNeg", "neg", "Cross ask", "Ask one sharp question. Make it answerable.", duration.crossAsk, false),
    createRound("answerAff", "aff", "Cross answer", "Answer directly, then turn the point.", duration.crossAnswer, false),
    createRound("closeAff", "aff", "Closing", "Compare the round and explain why you win.", duration.closing, false),
    createRound("closeNeg", "neg", "Closing", "Compare the round and explain why you win.", duration.closing, false)
  ];
}

function createRound(id, side, label, prompt, duration, isPrivate) {
  return { id, side, label, prompt, duration, isPrivate };
}
