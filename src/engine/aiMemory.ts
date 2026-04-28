import type { AiMemoryEntry, GameState, HiddenContent } from "../types";

export function rememberAiObservation(
  state: GameState,
  observation: { cellId: number; content: HiddenContent }
): GameState {
  const entry: AiMemoryEntry = {
    cellId: observation.cellId,
    content: observation.content,
    seenAtTurn: state.turnNumber,
  };

  return {
    ...state,
    aiMemory: {
      ...state.aiMemory,
      entries: [...state.aiMemory.entries.filter((item) => item.cellId !== entry.cellId), entry].slice(-state.aiMemory.limit),
    },
  };
}

export function decayAiMemoryForTurn(state: GameState): GameState {
  if (state.gameMode !== "ai" || state.currentTurn !== "blue") return state;
  if (state.aiMemory.lastDecayTurnNumber === state.turnNumber) return state;

  const aiTurnNumber = getAiTurnNumber(state);
  const decayChance = aiTurnNumber >= 7 ? 0.35 : aiTurnNumber >= 4 ? 0.2 : 0;
  const shouldForget = decayChance > 0 && Math.random() < decayChance;

  return {
    ...state,
    aiMemory: {
      ...state.aiMemory,
      entries: shouldForget ? state.aiMemory.entries.slice(1) : state.aiMemory.entries,
      lastDecayTurnNumber: state.turnNumber,
    },
  };
}

export function rememberAiAction(
  state: GameState,
  actionType: NonNullable<GameState["aiMemory"]["lastActionType"]>
): GameState {
  return {
    ...state,
    aiMemory: {
      ...state.aiMemory,
      lastActionType: actionType,
    },
  };
}

function getAiTurnNumber(state: GameState): number {
  return Math.floor(state.turnNumber / 2);
}
