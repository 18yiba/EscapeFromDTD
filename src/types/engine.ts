/**
 * engine 领域模型（与 React/UI 无关）。
 * MVP 阶段只定义“支撑最小可运行一局”的字段与动作类型。
 */

export type PlayerId = "red" | "blue";

export type GameStatus = "playing" | "finished";

export type GameMode = "hotseat" | "ai";

export type RouteType = "straight" | "turn" | "tee" | "cross";

export type DtdCardType = "space-anxiety" | "route-chaos" | "landmark-chaos";

export type DtdTargetType = "player" | "placed_route" | "landmark_or_blank";

export type DtdEffectType = "skip_turn" | "rotate_placed_routes" | "swap_landmark_or_blank";

export type Direction = "up" | "right" | "down" | "left";

export type Rotation = 0 | 1 | 2 | 3;

export type CellKind = "normal" | "finish";

export type HiddenContent =
  | { kind: "landmark"; owner: PlayerId; label: string }
  | { kind: "blank" };

export type RevealedContent =
  | { kind: "landmark"; owner: PlayerId; label: string }
  | { kind: "blank" }
  | { kind: "finish" };

export interface RoutePlacement {
  cardId: string;
  routeType: RouteType;
  rotation: Rotation;
  owner: PlayerId;
}

export interface CellState {
  id: number;
  row: number;
  col: number;
  kind: CellKind;
  hidden: HiddenContent | null;
  revealed: RevealedContent;
  route: RoutePlacement | null;
}

export interface BoardState {
  rows: number;
  cols: number;
  cells: CellState[];
}

export interface RouteCard {
  id: string;
  kind: "route";
  routeType: RouteType;
}

export interface DtdCard {
  id: string;
  kind: "dtd";
  type: DtdCardType;
  targetType: DtdTargetType;
  requiresTarget: boolean;
  effect: DtdEffectType;
  consumesAction: boolean;
}

export type Card = RouteCard | DtdCard;

export interface PlayerState {
  id: PlayerId;
  name: string;
  handCards: Card[];
}

export interface AiMemoryEntry {
  cellId: number;
  content: HiddenContent;
  seenAtTurn: number;
}

export interface AiMemoryState {
  entries: AiMemoryEntry[];
  limit: number;
  lastActionType?: "inspectCell" | "placeRoute" | "useDtd" | "endTurn";
  lastDecayTurnNumber?: number;
}

export type WinClaimValidationMark = "correct" | "incorrect";

export interface WinClaimState {
  claimant: PlayerId;
  selectedLandmarkCellIds: number[];
  validationResult?: Record<number, WinClaimValidationMark>;
}

export interface GameState {
  status: GameStatus;
  winnerId: PlayerId | null;
  gameMode: GameMode;
  board: BoardState;
  drawPile: Card[];
  discardPile: Card[];
  currentTurn: PlayerId;
  turnNumber: number;
  turnActionUsed: "inspect" | "placeRoute" | "useDtd" | null;
  winClaim: WinClaimState | null;
  playerEffects: Record<PlayerId, { skipNextTurn: boolean }>;
  players: Record<PlayerId, PlayerState>;
  aiMemory: AiMemoryState;
  /**
   * 当前与 Finish 连通的己方地标数量（按阵营统计）。
   */
  progress: Record<PlayerId, number>;
}

export type DtdActionTarget =
  | { type: "player"; playerId: PlayerId }
  | { type: "line"; axis: "row" | "col"; index: number }
  | { type: "cells"; cellIds: [number, number] };

export type EngineAction =
  | { type: "init" }
  | { type: "inspectCell"; playerId: PlayerId; cellId: number }
  | { type: "placeRoute"; playerId: PlayerId; cardId: string; cellId: number; rotation: Rotation }
  | { type: "useDtd"; playerId: PlayerId; cardId: string; target: DtdActionTarget }
  | { type: "startWinClaim"; playerId: PlayerId }
  | { type: "cancelWinClaim"; playerId: PlayerId }
  | { type: "toggleWinClaimLandmark"; playerId: PlayerId; cellId: number }
  | { type: "submitWinClaim"; playerId: PlayerId }
  | { type: "endTurn" };

export type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; state: GameState; error: string };
