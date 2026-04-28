import { WIN_CONNECTED_LANDMARKS } from "../constants";
import type { Card, CellState, DtdCard, EngineAction, GameState, Rotation, RouteCard } from "../types";

const MEMORY_USE_THRESHOLD = 3;
const SUBOPTIMAL_ACTION_CHANCE = 0.15;

export function decideAiAction(state: GameState): EngineAction | null {
  if (state.gameMode !== "ai" || state.currentTurn !== "blue" || state.status !== "playing") {
    return null;
  }

  if (state.turnActionUsed !== null || state.playerEffects.blue.skipNextTurn) {
    return null;
  }

  const inspectAction = buildInspectAction(state);
  const aiTurnNumber = getAiTurnNumber(state);
  if (aiTurnNumber <= 1) {
    return inspectAction;
  }

  const effectiveMemoryCount = getEffectiveMemoryEntries(state).length;
  if (effectiveMemoryCount <= MEMORY_USE_THRESHOLD && inspectAction) {
    return inspectAction;
  }

  const preferredActions = buildPreferredActions(state);
  const fallbackActions = buildFallbackActions(state, inspectAction);
  const actionPool = Math.random() < SUBOPTIMAL_ACTION_CHANCE ? fallbackActions : preferredActions;

  return actionPool[0] ?? preferredActions[0] ?? fallbackActions[0] ?? inspectAction ?? null;
}

function buildPreferredActions(state: GameState): EngineAction[] {
  const actions: EngineAction[] = [];
  const routeAction = buildRouteAction(state);
  const dtdAction = buildDtdAction(state);

  if (state.progress.blue >= WIN_CONNECTED_LANDMARKS - 1 && routeAction) {
    actions.push(routeAction);
  }

  if (state.progress.red >= WIN_CONNECTED_LANDMARKS - 1 && dtdAction) {
    actions.push(dtdAction);
  }

  if (routeAction && !actions.includes(routeAction)) {
    actions.push(routeAction);
  }

  if (dtdAction && !actions.includes(dtdAction)) {
    actions.push(dtdAction);
  }

  return actions;
}

function buildFallbackActions(state: GameState, inspectAction: EngineAction | null): EngineAction[] {
  const actions: EngineAction[] = [];
  const routeAction = buildRandomRouteAction(state);
  const dtdAction = buildDtdAction(state);

  if (routeAction) actions.push(routeAction);
  if (dtdAction) actions.push(dtdAction);
  if (inspectAction) actions.push(inspectAction);

  return shuffleActions(actions);
}

function buildInspectAction(state: GameState): EngineAction | null {
  const knownCellIds = new Set(state.aiMemory.entries.map((entry) => entry.cellId));
  const unknownCells = state.board.cells.filter(
    (cell) => cell.kind === "normal" && Boolean(cell.hidden) && !knownCellIds.has(cell.id)
  );
  const cell = pickRandom(unknownCells.length > 0 ? unknownCells : state.board.cells.filter((candidate) => candidate.kind === "normal" && Boolean(candidate.hidden)));
  if (!cell) return null;

  return {
    type: "inspectCell",
    playerId: "blue",
    cellId: cell.id,
  };
}

function buildRouteAction(state: GameState): EngineAction | null {
  const routeCard = getRouteCard(state.players.blue.handCards);
  if (!routeCard) return null;

  const candidates = state.board.cells
    .filter((cell) => cell.kind !== "finish")
    .sort((a, b) => scoreRouteCell(state, b) - scoreRouteCell(state, a));
  const bestScore = candidates[0] ? scoreRouteCell(state, candidates[0]) : Number.NEGATIVE_INFINITY;
  const bestCandidates = candidates.filter((cell) => scoreRouteCell(state, cell) === bestScore);
  const cell = pickRandom(bestCandidates);
  if (!cell) return null;

  return {
    type: "placeRoute",
    playerId: "blue",
    cardId: routeCard.id,
    cellId: cell.id,
    rotation: randomRotation(),
  };
}

function buildRandomRouteAction(state: GameState): EngineAction | null {
  const routeCard = getRouteCard(state.players.blue.handCards);
  const cell = pickRandom(state.board.cells.filter((candidate) => candidate.kind !== "finish"));
  if (!routeCard || !cell) return null;

  return {
    type: "placeRoute",
    playerId: "blue",
    cardId: routeCard.id,
    cellId: cell.id,
    rotation: randomRotation(),
  };
}

function buildDtdAction(state: GameState): EngineAction | null {
  if (state.aiMemory.lastActionType === "useDtd") return null;

  return buildSpaceAnxietyAction(state) ?? buildRouteChaosAction(state) ?? buildLandmarkChaosAction(state);
}

function buildSpaceAnxietyAction(state: GameState): EngineAction | null {
  if (state.progress.red < WIN_CONNECTED_LANDMARKS - 1) return null;
  const card = getDtdCard(state.players.blue.handCards, "space-anxiety");
  if (!card) return null;

  return {
    type: "useDtd",
    playerId: "blue",
    cardId: card.id,
    target: { type: "player", playerId: "red" },
  };
}

function buildRouteChaosAction(state: GameState): EngineAction | null {
  if (state.progress.red < 1 && !hasRedRouteAdvantage(state)) return null;
  const card = getDtdCard(state.players.blue.handCards, "route-chaos");
  const target = getBestRouteChaosTarget(state);
  if (!card || !target) return null;

  return {
    type: "useDtd",
    playerId: "blue",
    cardId: card.id,
    target: { type: "line", ...target },
  };
}

function buildLandmarkChaosAction(state: GameState): EngineAction | null {
  const card = getDtdCard(state.players.blue.handCards, "landmark-chaos");
  const knownCells = getEffectiveMemoryEntries(state)
    .map((entry) => state.board.cells.find((cell) => cell.id === entry.cellId))
    .filter((cell): cell is CellState => Boolean(cell && cell.kind !== "finish" && cell.hidden));
  const first = knownCells[0];
  const second = knownCells.find((cell) => cell.id !== first?.id);
  if (!card || !first || !second) return null;

  return {
    type: "useDtd",
    playerId: "blue",
    cardId: card.id,
    target: { type: "cells", cellIds: [first.id, second.id] },
  };
}

function getEffectiveMemoryEntries(state: GameState) {
  const availableCellIds = new Set(state.board.cells.filter((cell) => cell.kind !== "finish").map((cell) => cell.id));
  return state.aiMemory.entries.filter((entry) => availableCellIds.has(entry.cellId));
}

function scoreRouteCell(state: GameState, cell: CellState): number {
  const nearFinishScore = (state.board.rows - cell.row) + (state.board.cols - cell.col);
  const adjacentBlueRouteScore = getAdjacentCells(state, cell).filter((candidate) => candidate.route?.owner === "blue").length * 4;
  const emptyCellScore = cell.route ? 0 : 2;
  return nearFinishScore + adjacentBlueRouteScore + emptyCellScore;
}

function getAdjacentCells(state: GameState, cell: CellState): CellState[] {
  return state.board.cells.filter(
    (candidate) => Math.abs(candidate.row - cell.row) + Math.abs(candidate.col - cell.col) === 1
  );
}

function hasRedRouteAdvantage(state: GameState): boolean {
  const redRoutes = state.board.cells.filter((cell) => cell.route?.owner === "red").length;
  const blueRoutes = state.board.cells.filter((cell) => cell.route?.owner === "blue").length;
  return redRoutes - blueRoutes >= 2;
}

function getBestRouteChaosTarget(state: GameState): { axis: "row" | "col"; index: number } | null {
  const rows = Array.from({ length: state.board.rows }, (_, index) => ({
    axis: "row" as const,
    index,
    score: state.board.cells.filter((cell) => cell.row === index && cell.route?.owner === "red").length,
  }));
  const cols = Array.from({ length: state.board.cols }, (_, index) => ({
    axis: "col" as const,
    index,
    score: state.board.cells.filter((cell) => cell.col === index && cell.route?.owner === "red").length,
  }));
  const [best] = [...rows, ...cols].sort((a, b) => b.score - a.score);
  if (!best || best.score <= 0) return null;
  return { axis: best.axis, index: best.index };
}

function getRouteCard(cards: Card[]): RouteCard | null {
  return cards.find((card): card is RouteCard => card.kind === "route") ?? null;
}

function getDtdCard(cards: Card[], type: DtdCard["type"]): DtdCard | null {
  return cards.find((card): card is DtdCard => card.kind === "dtd" && card.type === type) ?? null;
}

function getAiTurnNumber(state: GameState): number {
  return Math.floor(state.turnNumber / 2);
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function randomRotation(): Rotation {
  return Math.floor(Math.random() * 4) as Rotation;
}

function shuffleActions(actions: EngineAction[]): EngineAction[] {
  return actions
    .map((action) => ({ action, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ action }) => action);
}
