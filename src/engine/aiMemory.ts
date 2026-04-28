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
