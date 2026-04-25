/**
 * store/gameStore.ts
 * Zustand：应用级编排层
 * - 持有 scene、engineState、UI 选择态
 * - 调用 engine 纯函数并把结果写回
 *
 * 注意：规则/判定必须在 engine/，这里不要写具体游戏算法。
 */

import { create } from "zustand";
import type { GameState, PlayerId, Rotation } from "../types";
import type { RuleFeedback, Scene, ToastState } from "../types/ui";
import { applyAction, initializeGame } from "../engine";
import { WIN_CONNECTED_LANDMARKS } from "../constants";

type TemporaryInspectedLandmark = {
  owner: PlayerId;
  label: string;
};

type GameUIState = {
  selectedCardId: string | null;
  selectedCellId: number | null;
  selectedRotation: Rotation;
  toast: ToastState;
  ruleFeedback: RuleFeedback | null;
  temporaryInspectedLandmarks: Record<number, TemporaryInspectedLandmark>;
};

type GameActions = {
  setScene: (scene: Scene) => void;
  startNewGame: () => void;
  restart: () => void;

  selectCard: (cardId: string | null) => void;
  selectCell: (cellId: number | null) => void;
  rotateSelectedCardLeft: () => void;
  rotateSelectedCardRight: () => void;

  /**
   * 由 UI 触发的“确认放置”，具体规则由 engine 校验并返回 error。
   */
  confirmPlaceRoute: (args: { playerId: PlayerId; cardId: string; cellId: number; rotation: Rotation }) => void;
  inspectSelectedCell: () => void;
  startWinClaim: () => void;
  cancelWinClaim: () => void;
  toggleWinClaimLandmark: (cellId: number) => void;
  submitWinClaim: () => void;
  endTurn: () => void;

  closeToast: () => void;
};

export type GameStoreState = {
  scene: Scene;
  game: GameState | null;
  ui: GameUIState;
} & GameActions;

export function selectCanInspectSelectedCell(state: GameStoreState): boolean {
  const game = state.game;
  const selectedCellId = state.ui.selectedCellId;
  if (!game || selectedCellId == null || state.ui.selectedCardId !== null || game.turnActionUsed !== null) return false;
  const selected = game.board.cells.find((cell) => cell.id === selectedCellId);
  return Boolean(selected && selected.kind === "normal" && selected.hidden);
}

export function selectCanSelectHandCard(state: GameStoreState): boolean {
  return Boolean(state.game && state.game.turnActionUsed === null);
}

export function selectCanConfirmPlaceRoute(state: GameStoreState): boolean {
  return Boolean(
    state.game &&
      state.game.turnActionUsed === null &&
      state.ui.selectedCardId &&
      typeof state.ui.selectedCellId === "number"
  );
}

export function selectCanEndTurn(state: GameStoreState): boolean {
  return Boolean(state.game && state.game.status === "playing" && state.game.turnActionUsed !== null && state.game.winClaim === null);
}

export function selectCanStartWinClaim(state: GameStoreState): boolean {
  return Boolean(
    state.game &&
      state.game.status === "playing" &&
      state.game.winClaim === null &&
      state.game.progress[state.game.currentTurn] >= WIN_CONNECTED_LANDMARKS
  );
}

export function selectIsInWinClaimMode(state: GameStoreState): boolean {
  return Boolean(state.game?.winClaim);
}

const initialToast: ToastState = { open: false, level: "info", message: "" };
const ROTATION_COUNT = 4;
const INSPECT_REVEAL_DURATION_MS = 3000;
const inspectHideTimers = new Map<number, ReturnType<typeof setTimeout>>();

function clearInspectHideTimer(cellId: number) {
  const timerId = inspectHideTimers.get(cellId);
  if (timerId) {
    clearTimeout(timerId);
    inspectHideTimers.delete(cellId);
  }
}

function clearAllInspectHideTimers() {
  inspectHideTimers.forEach((timerId) => clearTimeout(timerId));
  inspectHideTimers.clear();
}

function rotateClockwise(rotation: Rotation): Rotation {
  return ((rotation + 1) % ROTATION_COUNT) as Rotation;
}

function rotateCounterClockwise(rotation: Rotation): Rotation {
  return ((rotation + ROTATION_COUNT - 1) % ROTATION_COUNT) as Rotation;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  scene: "landing",
  game: null,
  ui: {
    selectedCardId: null,
    selectedCellId: null,
    selectedRotation: 0,
    toast: initialToast,
    ruleFeedback: null,
    temporaryInspectedLandmarks: {},
  },

  setScene: (scene) => set({ scene }),

  startNewGame: () => {
    const game = initializeGame();
    clearAllInspectHideTimers();
    set({
      scene: "inGame",
      game,
      ui: {
        ...get().ui,
        selectedCardId: null,
        selectedCellId: null,
        selectedRotation: 0,
        ruleFeedback: null,
        temporaryInspectedLandmarks: {},
      },
    });
  },

  restart: () => {
    clearAllInspectHideTimers();
    set({
      scene: "landing",
      game: null,
      ui: {
        ...get().ui,
        selectedCardId: null,
        selectedCellId: null,
        selectedRotation: 0,
        toast: initialToast,
        ruleFeedback: null,
        temporaryInspectedLandmarks: {},
      },
    });
  },

  selectCard: (cardId) =>
    set((s) => {
      const nextCardId = s.ui.selectedCardId === cardId ? null : cardId;
      return {
        ui: {
          ...s.ui,
          selectedCardId: nextCardId,
          selectedRotation: nextCardId === null ? 0 : s.ui.selectedRotation,
        },
      };
    }),
  selectCell: (cellId) => set((s) => ({ ui: { ...s.ui, selectedCellId: cellId } })),
  rotateSelectedCardLeft: () =>
    set((s) => ({
      ui: {
        ...s.ui,
        selectedRotation: rotateCounterClockwise(s.ui.selectedRotation),
      },
    })),
  rotateSelectedCardRight: () =>
    set((s) => ({
      ui: {
        ...s.ui,
        selectedRotation: rotateClockwise(s.ui.selectedRotation),
      },
    })),

  confirmPlaceRoute: (args) => {
    const current = get().game;
    if (!current) {
      set((s) => ({ ui: { ...s.ui, toast: { open: true, level: "error", message: "对局未开始。" } } }));
      return;
    }

    const result = applyAction(current, { type: "placeRoute", ...args });
    if (!result.ok) {
      set((s) => ({ game: result.state, ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }

    set((s) => ({
      game: result.state,
      ui: {
        ...s.ui,
        selectedCardId: null,
        selectedRotation: 0,
        ruleFeedback: {
          playerId: args.playerId,
          connectedCount: result.state.progress[args.playerId],
          threshold: WIN_CONNECTED_LANDMARKS,
          formedAfterPlacement: result.state.progress[args.playerId] >= WIN_CONNECTED_LANDMARKS,
        },
        toast: {
          open: result.state.progress[args.playerId] >= WIN_CONNECTED_LANDMARKS,
          level: "info",
          message:
            result.state.progress[args.playerId] >= WIN_CONNECTED_LANDMARKS
              ? "已有可能达成胜利条件，请主动宣布胜利。"
              : "",
        },
      },
    }));
  },

  inspectSelectedCell: () => {
    const state = get();
    if (!selectCanInspectSelectedCell(state) || !state.game || state.ui.selectedCellId == null) {
      return;
    }

    const cellId = state.ui.selectedCellId;
    const inspectedBeforeAction = state.game.board.cells.find((cell) => cell.id === cellId);
    const playerId = state.game.currentTurn;
    const result = applyAction(state.game, {
      type: "inspectCell",
      playerId,
      cellId,
    });

    if (!result.ok) {
      set((s) => ({ ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }

    const inspectedLandmark =
      inspectedBeforeAction?.hidden?.kind === "landmark"
        ? {
            owner: inspectedBeforeAction.hidden.owner,
            label: inspectedBeforeAction.hidden.label,
          }
        : null;
    const message =
      inspectedLandmark
        ? `查看结果：${inspectedLandmark.owner === "red" ? "红方" : "蓝方"}-${inspectedLandmark.label}`
        : "查看结果：空白。";

    if (inspectedLandmark) {
      clearInspectHideTimer(cellId);
      const timerId = setTimeout(() => {
        set((s) => {
          if (!s.ui.temporaryInspectedLandmarks[cellId]) {
            return s;
          }
          const nextTemporaryInspectedLandmarks = { ...s.ui.temporaryInspectedLandmarks };
          delete nextTemporaryInspectedLandmarks[cellId];
          return {
            ui: {
              ...s.ui,
              temporaryInspectedLandmarks: nextTemporaryInspectedLandmarks,
            },
          };
        });
        inspectHideTimers.delete(cellId);
      }, INSPECT_REVEAL_DURATION_MS);
      inspectHideTimers.set(cellId, timerId);
    }

    set((s) => ({
      game: result.state,
      ui: {
        ...s.ui,
        temporaryInspectedLandmarks: inspectedLandmark
          ? {
              ...s.ui.temporaryInspectedLandmarks,
              [cellId]: inspectedLandmark,
            }
          : s.ui.temporaryInspectedLandmarks,
        toast: { open: true, level: "info", message },
      },
    }));
  },

  startWinClaim: () => {
    const state = get();
    if (!state.game) return;
    const result = applyAction(state.game, { type: "startWinClaim", playerId: state.game.currentTurn });
    if (!result.ok) {
      set((s) => ({ game: result.state, ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }
    set({ game: result.state });
  },

  cancelWinClaim: () => {
    const state = get();
    if (!state.game) return;
    const result = applyAction(state.game, { type: "cancelWinClaim", playerId: state.game.currentTurn });
    if (!result.ok) {
      set((s) => ({ game: result.state, ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }
    set({ game: result.state });
  },

  toggleWinClaimLandmark: (cellId) => {
    const state = get();
    if (!state.game) return;
    const result = applyAction(state.game, {
      type: "toggleWinClaimLandmark",
      playerId: state.game.currentTurn,
      cellId,
    });
    if (!result.ok) {
      set((s) => ({ game: result.state, ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }
    set({ game: result.state });
  },

  submitWinClaim: () => {
    const state = get();
    if (!state.game) return;
    const result = applyAction(state.game, { type: "submitWinClaim", playerId: state.game.currentTurn });
    if (!result.ok) {
      set((s) => ({ game: result.state, ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }
    set((s) => ({
      scene: "result",
      game: result.state,
      ui: {
        ...s.ui,
        toast: {
          open: true,
          level: "info",
          message: "胜利验证成功，进入复盘结算。",
        },
      },
    }));
    if (result.state.status === "finished") {
      set({ scene: "result" });
    }
  },

  endTurn: () => {
    const current = get().game;
    if (!current) return;
    const result = applyAction(current, { type: "endTurn" });
    if (!result.ok) {
      set((s) => ({ ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }
    set({ game: result.state });
  },

  closeToast: () => set((s) => ({ ui: { ...s.ui, toast: initialToast } })),
}));
