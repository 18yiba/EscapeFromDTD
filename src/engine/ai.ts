import type { EngineAction, GameState, Rotation } from "../types";

export function decideAiAction(state: GameState): EngineAction | null {
  if (state.gameMode !== "ai" || state.currentTurn !== "blue" || state.status !== "playing") {
    return null;
  }

  if (state.turnActionUsed !== null || state.playerEffects.blue.skipNextTurn) {
    return null;
  }

  const routeCard = state.players.blue.handCards.find((card) => card.kind === "route");
  if (routeCard) {
    const candidates = state.board.cells.filter((cell) => cell.kind !== "finish");
    const cell = pickRandom(candidates);
    if (!cell) return null;

    return {
      type: "placeRoute",
      playerId: "blue",
      cardId: routeCard.id,
      cellId: cell.id,
      rotation: randomRotation(),
    };
  }

  const inspectCandidates = state.board.cells.filter((cell) => cell.kind === "normal" && Boolean(cell.hidden));
  const cell = pickRandom(inspectCandidates);
  if (!cell) return null;

  return {
    type: "inspectCell",
    playerId: "blue",
    cellId: cell.id,
  };
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function randomRotation(): Rotation {
  return Math.floor(Math.random() * 4) as Rotation;
}
