import { motions } from "../data/motions.js";
import { formats } from "../data/formats.js";
import { createRounds } from "../data/rounds.js";
import { loadSavedGame, saveGame, clearGame } from "../lib/storage.js";
import { judgeGame } from "../lib/judgeClient.js";

const initialGame = {
  screen: "home",
  motionId: "gorilla",
  customMotion: "",
  isCustomMotion: false,
  formatId: "blitz",
  names: {
    playerOne: "",
    playerTwo: ""
  },
  geminiKey: "",
  motion: motions[0],
  players: {
    aff: "Player 1",
    neg: "Player 2"
  },
  rounds: [],
  roundIndex: 0,
  notes: {},
  isPaused: false,
  result: null,
  isJudging: false
};

export function createStore() {
  let gameState = loadSavedGame() || structuredClone(initialGame);
  let timerId = null;
  const listeners = new Set();

  function emit() {
    saveGame(createSavableGame(gameState));
    listeners.forEach((listener) => listener(gameState));
  }

  function update(recipe) {
    gameState = recipe(structuredClone(gameState));
    emit();
  }

  function currentRound() {
    return gameState.rounds[gameState.roundIndex] || null;
  }

  function stopTimer() {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
  }

  function startTimer() {
    stopTimer();
    const round = currentRound();
    if (!round || gameState.screen !== "match" || gameState.isPaused) return;

    timerId = window.setInterval(() => {
      const activeRound = currentRound();
      if (!activeRound) return;
      if (activeRound.timeLeft <= 1) {
        actions.nextRound();
        return;
      }
      update((draft) => {
        draft.rounds[draft.roundIndex].timeLeft -= 1;
        return draft;
      });
    }, 1000);
  }

  const actions = {
    getState() {
      return gameState;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    afterRender() {
      startTimer();
    },

    chooseMotion(motionId) {
      update((draft) => {
        draft.motionId = motionId;
        draft.isCustomMotion = false;
        return draft;
      });
    },

    setCustomMotion(value) {
      gameState.customMotion = value;
      gameState.isCustomMotion = true;
      saveGame(gameState);
    },

    chooseFormat(formatId) {
      update((draft) => {
        draft.formatId = formatId;
        return draft;
      });
    },

    randomizeMotion() {
      const pool = motions.filter((motion) => motion.id !== gameState.motionId);
      const nextMotion = pool[Math.floor(Math.random() * pool.length)] || motions[0];
      update((draft) => {
        draft.motionId = nextMotion.id;
        draft.isCustomMotion = false;
        return draft;
      });
    },

    setName(nameKey, value) {
      gameState.names[nameKey] = value;
      saveGame(createSavableGame(gameState));
    },

    setGeminiKey(value) {
      gameState.geminiKey = value;
    },

    startMatch() {
      const selectedMotion = gameState.isCustomMotion
        ? {
            id: "custom",
            type: "Custom",
            heat: "Live",
            title: gameState.customMotion.trim() || "This house needs a motion.",
            angle: "Your table, your fight."
          }
        : motions.find((motion) => motion.id === gameState.motionId) || motions[0];

      const playerOne = gameState.names.playerOne.trim() || "Player 1";
      const playerTwo = gameState.names.playerTwo.trim() || "Player 2";
      const playerOneAff = Math.random() >= 0.5;
      const format = formats[gameState.formatId] || formats.blitz;
      const rounds = createRounds(format).map((round) => ({
        ...round,
        timeLeft: round.duration
      }));

      update((draft) => {
        draft.screen = "match";
        draft.motion = selectedMotion;
        draft.players = playerOneAff
          ? { aff: playerOne, neg: playerTwo }
          : { aff: playerTwo, neg: playerOne };
        draft.rounds = rounds;
        draft.roundIndex = 0;
        draft.notes = {};
        draft.isPaused = false;
        draft.result = null;
        draft.isJudging = false;
        return draft;
      });
    },

    saveNote(roundId, value) {
      gameState.notes[roundId] = value;
      saveGame(createSavableGame(gameState));
    },

    togglePause() {
      update((draft) => {
        draft.isPaused = !draft.isPaused;
        return draft;
      });
    },

    nextRound() {
      stopTimer();
      if (gameState.roundIndex < gameState.rounds.length - 1) {
        update((draft) => {
          draft.roundIndex += 1;
          draft.isPaused = false;
          return draft;
        });
        return;
      }
      actions.finishMatch();
    },

    async finishMatch() {
      stopTimer();
      update((draft) => {
        draft.screen = "judging";
        draft.isJudging = true;
        draft.isPaused = true;
        return draft;
      });

      const result = await judgeGame(gameState);

      update((draft) => {
        draft.screen = "results";
        draft.result = result;
        draft.isJudging = false;
        return draft;
      });
    },

    resetMatch() {
      stopTimer();
      clearGame();
      gameState = structuredClone(initialGame);
      emit();
    }
  };

  return actions;
}

function createSavableGame(gameState) {
  const savableGame = structuredClone(gameState);
  savableGame.geminiKey = "";
  return savableGame;
}
