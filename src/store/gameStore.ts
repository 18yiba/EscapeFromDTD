/**
 * store/gameStore.ts
 * Zustand：应用级编排层
 * - 持有 scene、engineState、UI 选择态
 * - 调用 engine 纯函数并把结果写回
 *
 * 注意：规则/判定必须在 engine/，这里不要写具体游戏算法。
 */

import { create } from "zustand";
import type { DtdCardType, EngineAction, GameState, PlayerId, Rotation } from "../types";
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
  routeChaosTarget: { axis: "row" | "col"; index: number } | null;
  landmarkChaosCellIds: number[];
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
  selectRouteChaosTarget: (target: { axis: "row" | "col"; index: number }) => void;
  toggleLandmarkChaosCell: (cellId: number) => void;
  rotateSelectedCardLeft: () => void;
  rotateSelectedCardRight: () => void;

  /**
   * 由 UI 触发的“确认放置”，具体规则由 engine 校验并返回 error。
   */
  confirmPlaceRoute: (args: { playerId: PlayerId; cardId: string; cellId: number; rotation: Rotation }) => void;
  confirmUseDtd: () => void;
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
  if (
    !game ||
    selectedCellId == null ||
    state.ui.selectedCardId !== null ||
    game.turnActionUsed !== null ||
    game.playerEffects[game.currentTurn].skipNextTurn
  ) {
    return false;
  }
  const selected = game.board.cells.find((cell) => cell.id === selectedCellId);
  return Boolean(selected && selected.kind === "normal" && selected.hidden);
}

export function selectCanSelectHandCard(state: GameStoreState): boolean {
  return Boolean(state.game && state.game.turnActionUsed === null && !state.game.playerEffects[state.game.currentTurn].skipNextTurn);
}

export function selectCanConfirmPlaceRoute(state: GameStoreState): boolean {
  const selectedCard = getSelectedCard(state);
  return Boolean(
    state.game &&
      state.game.turnActionUsed === null &&
      selectedCard?.kind === "route" &&
      typeof state.ui.selectedCellId === "number" &&
      !state.game.playerEffects[state.game.currentTurn].skipNextTurn
  );
}

export function selectCanEndTurn(state: GameStoreState): boolean {
  return Boolean(
    state.game &&
      state.game.status === "playing" &&
      (state.game.turnActionUsed !== null || state.game.playerEffects[state.game.currentTurn].skipNextTurn) &&
      state.game.winClaim === null
  );
}

export function selectCanStartWinClaim(state: GameStoreState): boolean {
  return Boolean(
    state.game &&
      state.game.status === "playing" &&
      state.game.winClaim === null &&
      !state.game.playerEffects[state.game.currentTurn].skipNextTurn &&
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

function getSelectedCard(state: GameStoreState) {
  if (!state.game || !state.ui.selectedCardId) return null;
  return state.game.players[state.game.currentTurn].handCards.find((card) => card.id === state.ui.selectedCardId) ?? null;
}

function getDtdName(type: DtdCardType): string {
  if (type === "space-anxiety") return "空间焦虑";
  if (type === "route-chaos") return "路线混乱";
  return "地标混乱";
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  scene: "landing",
  game: null,
  ui: {
    selectedCardId: null,
    selectedCellId: null,
    selectedRotation: 0,
    routeChaosTarget: null,
    landmarkChaosCellIds: [],
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
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
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
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
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
          routeChaosTarget: null,
          landmarkChaosCellIds: [],
        },
      };
    }),
  selectCell: (cellId) => set((s) => ({ ui: { ...s.ui, selectedCellId: cellId } })),
  selectRouteChaosTarget: (target) => set((s) => ({ ui: { ...s.ui, routeChaosTarget: target } })),
  toggleLandmarkChaosCell: (cellId) =>
    set((s) => {
      const exists = s.ui.landmarkChaosCellIds.includes(cellId);
      return {
        ui: {
          ...s.ui,
          landmarkChaosCellIds: exists
            ? s.ui.landmarkChaosCellIds.filter((id) => id !== cellId)
            : [...s.ui.landmarkChaosCellIds, cellId].slice(-2),
        },
      };
    }),
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
        selectedCellId: null,
        selectedRotation: 0,
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
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

  confirmUseDtd: () => {
    const state = get();
    const current = state.game;
    const selectedCard = getSelectedCard(state);
    if (!current || !selectedCard || selectedCard.kind !== "dtd") {
      set((s) => ({ ui: { ...s.ui, toast: { open: true, level: "error", message: "请先选择 DTD 卡。" } } }));
      return;
    }

    const playerId = current.currentTurn;
    const opponentId: PlayerId = playerId === "red" ? "blue" : "red";
    let target: Extract<EngineAction, { type: "useDtd" }>["target"] | null = null;
    if (selectedCard.type === "space-anxiety") {
      target = { type: "player", playerId: opponentId };
    } else if (selectedCard.type === "route-chaos" && state.ui.routeChaosTarget) {
      target = { type: "line", ...state.ui.routeChaosTarget };
    } else if (selectedCard.type === "landmark-chaos" && state.ui.landmarkChaosCellIds.length === 2) {
      target = { type: "cells", cellIds: [state.ui.landmarkChaosCellIds[0], state.ui.landmarkChaosCellIds[1]] };
    }

    if (!target) {
      set((s) => ({ ui: { ...s.ui, toast: { open: true, level: "error", message: "请先完成 DTD 目标选择。" } } }));
      return;
    }

    const result = applyAction(current, { type: "useDtd", playerId, cardId: selectedCard.id, target });
    if (!result.ok) {
      set((s) => ({ game: result.state, ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }

    set((s) => ({
      game: result.state,
      ui: {
        ...s.ui,
        selectedCardId: null,
        selectedCellId: null,
        selectedRotation: 0,
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
        ruleFeedback: {
          playerId,
          connectedCount: result.state.progress[playerId],
          threshold: WIN_CONNECTED_LANDMARKS,
          formedAfterPlacement: result.state.progress[playerId] >= WIN_CONNECTED_LANDMARKS,
        },
        toast: {
          open: true,
          level: "info",
          message: `已使用 ${getDtdName(selectedCard.type)}。`,
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
    set((s) => ({
      game: result.state,
      ui: {
        ...s.ui,
        selectedCardId: null,
        selectedCellId: null,
        selectedRotation: 0,
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
      },
    }));
  },

  cancelWinClaim: () => {
    const state = get();
    if (!state.game) return;
    const result = applyAction(state.game, { type: "cancelWinClaim", playerId: state.game.currentTurn });
    if (!result.ok) {
      set((s) => ({ game: result.state, ui: { ...s.ui, toast: { open: true, level: "error", message: result.error } } }));
      return;
    }
    set((s) => ({
      game: result.state,
      ui: {
        ...s.ui,
        selectedCardId: null,
        selectedCellId: null,
        selectedRotation: 0,
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
      },
    }));
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
    set((s) => ({
      game: result.state,
      ui: {
        ...s.ui,
        selectedCardId: null,
        selectedCellId: null,
        selectedRotation: 0,
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
      },
    }));
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
    set((s) => ({
      game: result.state,
      ui: {
        ...s.ui,
        selectedCardId: null,
        selectedCellId: null,
        selectedRotation: 0,
        routeChaosTarget: null,
        landmarkChaosCellIds: [],
      },
    }));
  },

  closeToast: () => set((s) => ({ ui: { ...s.ui, toast: initialToast } })),
}));
