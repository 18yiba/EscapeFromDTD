import { io, type Socket } from "socket.io-client";
import type { GameState, HiddenContent } from "../types";
import type { CreateRoomAck, JoinRoomAck, OnlinePlayerId, OnlinePlayerRole, OnlineRoomState, RestoreHostAck, RoomStateAck } from "./types";

const ROOM_SERVER_URL = import.meta.env.VITE_ROOM_SERVER_URL || "http://localhost:3001";
const ACK_TIMEOUT_MS = 5000;

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(ROOM_SERVER_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

function emitWithAck<TAck>(eventName: string, payload: object) {
  return new Promise<TAck>((resolve, reject) => {
    getSocket()
      .timeout(ACK_TIMEOUT_MS)
      .emit(eventName, payload, (error: Error | null, ack: TAck) => {
        if (error) {
          reject(new Error("房间服务暂时不可用，请确认联机服务已启动。"));
          return;
        }
        resolve(ack);
      });
  });
}

export const roomClient = {
  createRoom(payload: { userId?: string; displayName?: string } = {}) {
    return emitWithAck<CreateRoomAck>("room:create", payload);
  },

  joinRoom(payload: { roomId: string; userId?: string; displayName?: string }) {
    return emitWithAck<JoinRoomAck>("room:join", payload);
  },

  restoreHost(payload: { roomId: string; hostToken: string; userId?: string; displayName?: string }) {
    return emitWithAck<RestoreHostAck>("room:restore_host", payload);
  },

  setReady(payload: { roomId: string; role: OnlinePlayerRole; token: string; ready: boolean }) {
    return emitWithAck<RoomStateAck>("room:set_ready", payload);
  },

  startTutorial(payload: { roomId: string; hostToken: string }) {
    return emitWithAck<RoomStateAck>("room:start_tutorial", payload);
  },

  setTutorialReady(payload: { roomId: string; role: OnlinePlayerRole; token: string; tutorialReady: boolean }) {
    return emitWithAck<RoomStateAck>("room:set_tutorial_ready", payload);
  },

  initGame(payload: { roomId: string; hostToken: string; gameState: GameState }) {
    return emitWithAck<RoomStateAck>("room:init_game", payload);
  },

  submitGameState(payload: {
    roomId: string;
    role: OnlinePlayerRole;
    token: string;
    by: OnlinePlayerId;
    baseVersion: number;
    actionType: string;
    nextGameState: GameState;
    inspection?: {
      cellId: number;
      content: HiddenContent;
    };
  }) {
    return emitWithAck<RoomStateAck>("room:submit_game_state", payload);
  },

  onRoomState(handler: (room: OnlineRoomState) => void) {
    getSocket().on("room:state", handler);
    return () => getSocket().off("room:state", handler);
  },
};
