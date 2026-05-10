import { create } from "zustand";
import { applyAction } from "../engine";
import { debugOnlineInspection, debugOnlineRoom } from "../online/debug";
import { getLocalPlayerColor, getLocalPlayerId } from "../online/playerMapping";
import { roomClient } from "../online/roomClient";
import { readStoredRoomSession, writeStoredRoomSession } from "../online/storage";
import type { ConnectionStatus, CopiedLinkType, OnlinePlayerRole, OnlineRoomState } from "../online/types";
import { buildHostRecoveryUrl, buildInviteUrl, normalizeRoomId, parseRoomUrl } from "../online/url";
import type { EngineAction, GameState } from "../types";

type OnlineRoomActions = {
  createRoom: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  initializeFromUrl: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  startTutorial: () => Promise<void>;
  confirmTutorialReady: () => Promise<void>;
  initOnlineGame: (gameState: GameState) => Promise<void>;
  submitOnlineAction: (action: EngineAction) => Promise<void>;
  markCopied: (linkType: CopiedLinkType) => void;
  clearError: () => void;
};

export type OnlineRoomStoreState = {
  roomId: string | null;
  role: OnlinePlayerRole | null;
  hostToken: string | null;
  guestToken: string | null;
  inviteUrl: string | null;
  hostRecoveryUrl: string | null;
  room: OnlineRoomState | null;
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;
  copiedLink: CopiedLinkType;
  hasInitializedFromUrl: boolean;
} & OnlineRoomActions;

function getRoomError(error: unknown) {
  return error instanceof Error ? error.message : "房间操作失败，请稍后重试。";
}

function toRoomLinks(roomId: string, hostToken: string | null) {
  return {
    inviteUrl: buildInviteUrl(roomId),
    hostRecoveryUrl: hostToken ? buildHostRecoveryUrl(roomId, hostToken) : null,
  };
}

function getActiveToken(state: OnlineRoomStoreState) {
  if (state.role === "host") return state.hostToken;
  if (state.role === "guest") return state.guestToken;
  return null;
}

function getActionType(action: EngineAction) {
  return action.type;
}

function getCurrentPlayer(state: OnlineRoomStoreState) {
  if (!state.room || !state.role) return null;
  return state.room.players.find((player) => player.role === state.role) ?? null;
}

export function selectIsOnlineGameLocked(state: OnlineRoomStoreState) {
  return Boolean(state.room && state.room.roomStatus !== "playing");
}

export const useOnlineRoomStore = create<OnlineRoomStoreState>((set, get) => ({
  roomId: null,
  role: null,
  hostToken: null,
  guestToken: null,
  inviteUrl: null,
  hostRecoveryUrl: null,
  room: null,
  connectionStatus: "idle",
  errorMessage: null,
  copiedLink: null,
  hasInitializedFromUrl: false,

  createRoom: async () => {
    set({ connectionStatus: "connecting", errorMessage: null, copiedLink: null });
    try {
      const ack = await roomClient.createRoom();
      if (!ack.ok) {
        set({ connectionStatus: "error", errorMessage: ack.error });
        return;
      }

      const links = toRoomLinks(ack.roomId, ack.hostToken);
      writeStoredRoomSession({
        roomId: ack.roomId,
        role: "host",
        hostToken: ack.hostToken,
        createdAt: Date.now(),
      });
      set({
        roomId: ack.roomId,
        role: "host",
        hostToken: ack.hostToken,
        guestToken: null,
        ...links,
        room: ack.room,
        connectionStatus: "connected",
        errorMessage: null,
      });
      debugOnlineRoom("create", ack.room, "host");
    } catch (error) {
      set({ connectionStatus: "error", errorMessage: getRoomError(error) });
    }
  },

  joinRoom: async (roomId) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    if (!normalizedRoomId) {
      set({ connectionStatus: "error", errorMessage: "请输入有效的邀请码。" });
      return;
    }

    set({ connectionStatus: "connecting", errorMessage: null, copiedLink: null });
    try {
      const ack = await roomClient.joinRoom({ roomId: normalizedRoomId });
      if (!ack.ok) {
        set({ connectionStatus: "error", errorMessage: ack.error });
        return;
      }

      const links = toRoomLinks(normalizedRoomId, null);
      set({
        roomId: normalizedRoomId,
        role: "guest",
        hostToken: null,
        guestToken: ack.guestToken,
        ...links,
        room: ack.room,
        connectionStatus: "connected",
        errorMessage: null,
      });
      debugOnlineRoom("join", ack.room, "guest");
    } catch (error) {
      set({ connectionStatus: "error", errorMessage: getRoomError(error) });
    }
  },

  initializeFromUrl: async () => {
    const { roomId, hostToken } = parseRoomUrl();
    if (!roomId) {
      set({ hasInitializedFromUrl: true, connectionStatus: "idle", errorMessage: null });
      return;
    }

    const storedSession = readStoredRoomSession();
    const storedHostToken =
      storedSession?.role === "host" && normalizeRoomId(storedSession.roomId) === roomId ? storedSession.hostToken : null;
    const recoveryToken = hostToken ?? storedHostToken;

    set({ hasInitializedFromUrl: true, connectionStatus: "connecting", errorMessage: null });
    if (recoveryToken) {
      try {
        const ack = await roomClient.restoreHost({ roomId, hostToken: recoveryToken });
        if (ack.ok) {
          const links = toRoomLinks(roomId, recoveryToken);
          writeStoredRoomSession({
            roomId,
            role: "host",
            hostToken: recoveryToken,
            createdAt: storedSession?.createdAt ?? Date.now(),
          });
          set({
            roomId,
            role: "host",
            hostToken: recoveryToken,
            guestToken: null,
            ...links,
            room: ack.room,
            connectionStatus: "connected",
            errorMessage: null,
          });
          debugOnlineRoom("restore-host", ack.room, "host");
          return;
        }
      } catch {
        // Fall through to guest join so a stale host token does not trap the user.
      }
    }

    await get().joinRoom(roomId);
  },

  setReady: async (ready) => {
    const state = get();
    const token = getActiveToken(state);
    if (!state.roomId || !state.role || !token) {
      set({ errorMessage: "当前房间身份不可用，请重新进入房间。", connectionStatus: "error" });
      return;
    }

    set({ errorMessage: null });
    try {
      const ack = await roomClient.setReady({ roomId: state.roomId, role: state.role, token, ready });
      if (!ack.ok) {
        set({ errorMessage: ack.error, connectionStatus: "error" });
        return;
      }
      set({ room: ack.room, connectionStatus: "connected" });
    } catch (error) {
      set({ errorMessage: getRoomError(error), connectionStatus: "error" });
    }
  },

  startTutorial: async () => {
    const state = get();
    if (!state.roomId || state.role !== "host" || !state.hostToken) {
      set({ errorMessage: "只有房主可以开始游戏。", connectionStatus: "error" });
      return;
    }

    set({ errorMessage: null });
    try {
      const ack = await roomClient.startTutorial({ roomId: state.roomId, hostToken: state.hostToken });
      if (!ack.ok) {
        set({ errorMessage: ack.error, connectionStatus: "error" });
        return;
      }
      set({ room: ack.room, connectionStatus: "connected" });
    } catch (error) {
      set({ errorMessage: getRoomError(error), connectionStatus: "error" });
    }
  },

  confirmTutorialReady: async () => {
    const state = get();
    const token = getActiveToken(state);
    if (!state.roomId || !state.role || !token) {
      set({ errorMessage: "当前房间身份不可用，请重新进入房间。", connectionStatus: "error" });
      return;
    }

    set({ errorMessage: null });
    try {
      const ack = await roomClient.setTutorialReady({ roomId: state.roomId, role: state.role, token, tutorialReady: true });
      if (!ack.ok) {
        set({ errorMessage: ack.error, connectionStatus: "error" });
        return;
      }
      set({ room: ack.room, connectionStatus: "connected" });
    } catch (error) {
      set({ errorMessage: getRoomError(error), connectionStatus: "error" });
    }
  },

  initOnlineGame: async (gameState) => {
    const state = get();
    if (!state.roomId || state.role !== "host" || !state.hostToken) return;
    if (state.room?.gameState) return;

    set({ errorMessage: null });
    try {
      const ack = await roomClient.initGame({ roomId: state.roomId, hostToken: state.hostToken, gameState });
      if (!ack.ok) {
        set({ errorMessage: ack.error, connectionStatus: "error" });
        return;
      }
      debugOnlineRoom("init-game", ack.room, state.role);
      set({ room: ack.room, connectionStatus: "connected" });
    } catch (error) {
      set({ errorMessage: getRoomError(error), connectionStatus: "error" });
    }
  },

  submitOnlineAction: async (action) => {
    const state = get();
    const room = state.room;
    const token = getActiveToken(state);
    if (!room || !state.role || !token) {
      set({ errorMessage: "当前房间身份不可用，请重新进入房间。", connectionStatus: "error" });
      return;
    }
    if (room.roomStatus !== "playing" || !room.gameState) {
      set({ errorMessage: "房间尚未进入正式游戏。", connectionStatus: "error" });
      return;
    }

    const localPlayerColor = getLocalPlayerColor(state.role);
    if (room.gameState.currentTurn !== localPlayerColor) {
      set({ errorMessage: "等待对方行动。" });
      return;
    }
    if ("playerId" in action && action.playerId !== localPlayerColor) {
      set({ errorMessage: "只能操作自己的阵营。" });
      return;
    }

    const beforeCell = action.type === "inspectCell" ? room.gameState.board.cells.find((cell) => cell.id === action.cellId) : undefined;
    const result = applyAction(room.gameState, action);
    if (!result.ok) {
      set({ room: { ...room, gameState: result.state }, errorMessage: result.error });
      return;
    }
    const afterCell = action.type === "inspectCell" ? result.state.board.cells.find((cell) => cell.id === action.cellId) : undefined;
    if (action.type === "inspectCell") {
      debugOnlineInspection({
        actionType: action.type,
        cellId: action.cellId,
        beforeCell,
        afterCell,
        version: room.version,
      });
    }

    try {
      const ack = await roomClient.submitGameState({
        roomId: room.roomId,
        role: state.role,
        token,
        by: getLocalPlayerId(state.role),
        baseVersion: room.version,
        actionType: getActionType(action),
        nextGameState: result.state,
        inspection:
          action.type === "inspectCell" && beforeCell?.hidden
            ? {
                cellId: action.cellId,
                content: beforeCell.hidden,
              }
            : undefined,
      });
      if (!ack.ok) {
        set({ errorMessage: ack.error, connectionStatus: "error" });
        return;
      }
      debugOnlineRoom("submit-action", ack.room, state.role);
      set({ room: ack.room, connectionStatus: "connected", errorMessage: null });
    } catch (error) {
      set({ errorMessage: getRoomError(error), connectionStatus: "error" });
    }
  },

  markCopied: (linkType) => {
    set({ copiedLink: linkType });
    if (linkType) {
      window.setTimeout(() => {
        if (get().copiedLink === linkType) set({ copiedLink: null });
      }, 1800);
    }
  },

  clearError: () => set({ errorMessage: null, connectionStatus: get().room ? "connected" : "idle" }),
}));

export { getCurrentPlayer };

roomClient.onRoomState((room) => {
  useOnlineRoomStore.setState((state) => {
    if (state.roomId !== room.roomId) return state;
    debugOnlineRoom("room-state", room, state.role);
    return { room, connectionStatus: "connected" };
  });
});
