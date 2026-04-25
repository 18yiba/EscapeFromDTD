import {
  BOARD_COLS,
  BOARD_ROWS,
  FINISH_CELL,
  HAND_LIMIT,
  LANDMARK_LABELS,
  PLAYERS,
  ROUTE_DECK,
  WIN_CONNECTED_LANDMARKS,
} from "../constants";
import { countConnectedLandmarks, getConnectedLandmarkCellIds, getConnectedNetworkCandidateCellIds, randomId, shuffle } from "../utils";
import type {
  BoardState,
  Card,
  CellState,
  EngineAction,
  EngineResult,
  GameState,
  HiddenContent,
  PlayerId,
  Rotation,
  RoutePlacement,
} from "../types";

export function initializeGame(): GameState {
  const board = createInitialBoard();
  const drawPile = shuffle(buildRouteDeck());

  const players = {
    red: { id: "red" as const, name: PLAYERS.red.name, handCards: [] as Card[] },
    blue: { id: "blue" as const, name: PLAYERS.blue.name, handCards: [] as Card[] },
  };

  refillHand(players.red, drawPile);
  refillHand(players.blue, drawPile);

  return {
    status: "playing",
    winnerId: null,
    board,
    drawPile,
    currentTurn: "red",
    turnActionUsed: null,
    winClaim: null,
    players,
    progress: {
      red: countConnectedLandmarks(board, "red"),
      blue: countConnectedLandmarks(board, "blue"),
    },
  };
}

export function applyAction(state: GameState, action: EngineAction): EngineResult {
  if (state.status === "finished") {
    return { ok: false, state, error: "本局已结束。" };
  }

  switch (action.type) {
    case "init":
      return { ok: true, state: initializeGame() };
    case "inspectCell":
      return inspectCell(state, action);
    case "placeRoute":
      return placeRoute(state, action);
    case "startWinClaim":
      return startWinClaim(state, action);
    case "cancelWinClaim":
      return cancelWinClaim(state, action);
    case "toggleWinClaimLandmark":
      return toggleWinClaimLandmark(state, action);
    case "submitWinClaim":
      return submitWinClaim(state, action);
    case "endTurn":
      return { ok: true, state: endTurn(state) };
    default:
      return { ok: false, state, error: "未知操作。" };
  }
}

function inspectCell(
  state: GameState,
  action: Extract<EngineAction, { type: "inspectCell" }>
): EngineResult {
  if (action.playerId !== state.currentTurn) {
    return { ok: false, state, error: "当前不是你的回合。" };
  }
  if (state.turnActionUsed !== null) {
    return { ok: false, state, error: "本回合已执行主行动，不能再次行动。" };
  }

  const cell = state.board.cells.find((candidate) => candidate.id === action.cellId);
  if (!cell || cell.kind === "finish" || !cell.hidden) {
    return { ok: false, state, error: "当前选中格不可查看。" };
  }

  return {
    ok: true,
    state: {
      ...state,
      turnActionUsed: "inspect",
      winClaim: null,
    },
  };
}

function endTurn(state: GameState): GameState {
  const next: PlayerId = state.currentTurn === "red" ? "blue" : "red";
  return { ...state, currentTurn: next, turnActionUsed: null, winClaim: null };
}

function placeRoute(
  state: GameState,
  action: Extract<EngineAction, { type: "placeRoute" }>
): EngineResult {
  if (action.playerId !== state.currentTurn) {
    return { ok: false, state, error: "当前不是你的回合。" };
  }
  if (state.turnActionUsed !== null) {
    return { ok: false, state, error: "本回合已执行主行动，不能再次行动。" };
  }

  const player = state.players[action.playerId];
  const cardIndex = player.handCards.findIndex((card) => card.id === action.cardId);
  if (cardIndex === -1) {
    return { ok: false, state, error: "未找到所选手牌。" };
  }

  const cell = state.board.cells.find((candidate) => candidate.id === action.cellId);
  if (!cell || cell.kind === "finish") {
    return { ok: false, state, error: "不能放置在该格。" };
  }
  const replacedRoute = cell.route;

  const card = player.handCards[cardIndex];
  const placement: RoutePlacement = {
    cardId: card.id,
    routeType: card.routeType,
    rotation: normalizeRotation(action.rotation),
    owner: action.playerId,
  };

  const nextBoard: BoardState = {
    ...state.board,
    cells: state.board.cells.map((candidate) => (candidate.id === cell.id ? { ...candidate, route: placement } : candidate)),
  };

  const nextHand = player.handCards.slice();
  nextHand.splice(cardIndex, 1);

  const nextPlayers = {
    ...state.players,
    [action.playerId]: { ...player, handCards: nextHand },
  };

  let nextDrawPile = state.drawPile.slice();
  if (replacedRoute) {
    nextDrawPile = shuffle([
      ...nextDrawPile,
      {
        id: replacedRoute.cardId,
        kind: "route",
        routeType: replacedRoute.routeType,
      },
    ]);
  }
  refillHand(nextPlayers[action.playerId], nextDrawPile);

  const progress = {
    red: countConnectedLandmarks(nextBoard, "red"),
    blue: countConnectedLandmarks(nextBoard, "blue"),
  };

  return {
    ok: true,
    state: {
      ...state,
      board: nextBoard,
      drawPile: nextDrawPile,
      players: nextPlayers,
      progress,
      turnActionUsed: "placeRoute",
      winClaim: null,
    },
  };
}

function startWinClaim(
  state: GameState,
  action: Extract<EngineAction, { type: "startWinClaim" }>
): EngineResult {
  if (action.playerId !== state.currentTurn) {
    return { ok: false, state, error: "当前不是你的回合。" };
  }
  if (state.winClaim) {
    return { ok: false, state, error: "当前已在胜利宣告模式。" };
  }
  if (state.progress[action.playerId] < WIN_CONNECTED_LANDMARKS) {
    return { ok: false, state, error: "当前尚未满足宣布胜利的资格。" };
  }

  return {
    ok: true,
    state: {
      ...state,
      winClaim: {
        claimant: action.playerId,
        selectedLandmarkCellIds: [],
      },
    },
  };
}

function cancelWinClaim(
  state: GameState,
  action: Extract<EngineAction, { type: "cancelWinClaim" }>
): EngineResult {
  if (!state.winClaim || state.winClaim.claimant !== action.playerId) {
    return { ok: false, state, error: "当前没有可取消的胜利宣告。" };
  }

  return {
    ok: true,
    state: {
      ...state,
      winClaim: null,
    },
  };
}

function toggleWinClaimLandmark(
  state: GameState,
  action: Extract<EngineAction, { type: "toggleWinClaimLandmark" }>
): EngineResult {
  if (!state.winClaim || state.winClaim.claimant !== action.playerId) {
    return { ok: false, state, error: "当前未进入胜利宣告模式。" };
  }

  const connectedNetworkCandidateCellIds = new Set(getConnectedNetworkCandidateCellIds(state.board));
  if (!connectedNetworkCandidateCellIds.has(action.cellId)) {
    return { ok: false, state, error: "只能选择当前已与 Finish 连通的路线网络中的牌位进行验证。" };
  }

  const cell = state.board.cells.find((candidate) => candidate.id === action.cellId);
  if (!cell || cell.kind === "finish" || !cell.hidden) {
    return { ok: false, state, error: "当前牌位不可用于验证。" };
  }

  const alreadySelected = state.winClaim.selectedLandmarkCellIds.includes(action.cellId);
  if (!alreadySelected && state.winClaim.selectedLandmarkCellIds.length >= WIN_CONNECTED_LANDMARKS) {
    return { ok: false, state, error: `最多只能选择 ${WIN_CONNECTED_LANDMARKS} 个地标。` };
  }

  return {
    ok: true,
    state: {
      ...state,
      winClaim: {
        ...state.winClaim,
        selectedLandmarkCellIds: alreadySelected
          ? state.winClaim.selectedLandmarkCellIds.filter((cellId) => cellId !== action.cellId)
          : [...state.winClaim.selectedLandmarkCellIds, action.cellId],
      },
    },
  };
}

function submitWinClaim(
  state: GameState,
  action: Extract<EngineAction, { type: "submitWinClaim" }>
): EngineResult {
  if (!state.winClaim || state.winClaim.claimant !== action.playerId) {
    return { ok: false, state, error: "当前未进入胜利宣告模式。" };
  }

  const { selectedLandmarkCellIds } = state.winClaim;
  if (selectedLandmarkCellIds.length !== WIN_CONNECTED_LANDMARKS) {
    return {
      ok: false,
      state,
      error: `请选择 ${WIN_CONNECTED_LANDMARKS} 张连通网络中的牌位后再提交验证。`,
    };
  }

  const isSuccessfulClaim = selectedLandmarkCellIds.every((cellId) => {
    const cell = state.board.cells.find((candidate) => candidate.id === cellId);
    return Boolean(cell && cell.hidden?.kind === "landmark" && cell.hidden.owner === action.playerId);
  });

  if (!isSuccessfulClaim) {
    const loser = action.playerId;
    const winner = loser === "red" ? "blue" : "red";
    return {
      ok: true,
      state: {
        ...state,
        status: "finished",
        winnerId: winner,
        winClaim: {
          ...state.winClaim,
          selectedLandmarkCellIds,
        },
      },
    };
  }

  const connectedLandmarkCellIds = new Set(getConnectedLandmarkCellIds(state.board, action.playerId));
  if (!selectedLandmarkCellIds.every((cellId) => connectedLandmarkCellIds.has(cellId))) {
    const loser = action.playerId;
    const winner = loser === "red" ? "blue" : "red";
    return {
      ok: true,
      state: {
        ...state,
        status: "finished",
        winnerId: winner,
        winClaim: {
          ...state.winClaim,
          selectedLandmarkCellIds,
        },
      },
    };
  }

  return {
    ok: true,
    state: {
      ...state,
      status: "finished",
      winnerId: action.playerId,
      winClaim: {
        ...state.winClaim,
        selectedLandmarkCellIds,
      },
    },
  };
}

function normalizeRotation(value: number): Rotation {
  const n = ((value % 4) + 4) % 4;
  return n as Rotation;
}

function createInitialBoard(): BoardState {
  const hidden = buildHiddenContents();
  const cells: CellState[] = [];

  let hiddenIndex = 0;
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const id = row * BOARD_COLS + col;
      const isFinish = row === FINISH_CELL.row && col === FINISH_CELL.col;
      const hiddenContent: HiddenContent | null = isFinish ? null : hidden[hiddenIndex++] ?? { kind: "blank" };
      cells.push({
        id,
        row,
        col,
        kind: isFinish ? "finish" : "normal",
        hidden: hiddenContent,
        revealed: isFinish ? { kind: "finish" } : { kind: "blank" },
        route: null,
      });
    }
  }

  return { rows: BOARD_ROWS, cols: BOARD_COLS, cells };
}

function buildHiddenContents(): HiddenContent[] {
  const list: HiddenContent[] = [];

  LANDMARK_LABELS.forEach((label) => list.push({ kind: "landmark", owner: "red", label }));
  LANDMARK_LABELS.forEach((label) => list.push({ kind: "landmark", owner: "blue", label }));
  while (list.length < BOARD_ROWS * BOARD_COLS - 1) list.push({ kind: "blank" });

  return shuffle(list);
}

function buildRouteDeck(): Card[] {
  const cards: Card[] = [];
  ROUTE_DECK.forEach(({ routeType, count }) => {
    for (let i = 0; i < count; i += 1) {
      cards.push({ id: `route-${routeType}-${i}-${randomId()}`, kind: "route", routeType });
    }
  });
  return cards;
}

function refillHand(player: { handCards: Card[] }, drawPile: Card[]) {
  while (player.handCards.length < HAND_LIMIT && drawPile.length > 0) {
    player.handCards.push(drawPile.shift()!);
  }
}
