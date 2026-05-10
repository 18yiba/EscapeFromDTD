import type { GameState, HiddenContent } from "../types";

export type OnlinePlayerRole = "host" | "guest";
export type OnlinePlayerId = "player1" | "player2";
export type RoomStatus = "waiting" | "tutorial" | "playing" | "finished";
export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
export type CopiedLinkType = "inviteCode" | null;

export interface OnlinePlayerSession {
  socketId: string;
  userId?: string;
  role: OnlinePlayerRole;
  playerId: OnlinePlayerId;
  displayName: string;
  connected: boolean;
  ready: boolean;
  tutorialReady: boolean;
}

export interface OnlineRoomState {
  roomId: string;
  roomStatus: RoomStatus;
  players: OnlinePlayerSession[];
  gameSeed?: string;
  gameState?: GameState;
  version: number;
  lastAction?: {
    by: OnlinePlayerId;
    type: string;
    at: number;
  };
  lastInspection?: {
    by: OnlinePlayerId;
    cellId: number;
    content: HiddenContent;
    at: number;
    expiresAt: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface StoredRoomSession {
  roomId: string;
  role: OnlinePlayerRole;
  hostToken?: string;
  guestToken?: string;
  inviteUrl?: string;
  createdAt: number;
}

export interface CreateRoomSuccess {
  ok: true;
  roomId: string;
  hostToken: string;
  inviteUrl: string;
  room: OnlineRoomState;
}

export interface JoinRoomSuccess {
  ok: true;
  guestToken: string;
  room: OnlineRoomState;
}

export interface RestoreHostSuccess {
  ok: true;
  room: OnlineRoomState;
}

export interface RoomError {
  ok: false;
  error: string;
}

export type CreateRoomAck = CreateRoomSuccess | RoomError;
export type JoinRoomAck = JoinRoomSuccess | RoomError;
export type RestoreHostAck = RestoreHostSuccess | RoomError;
export type RoomStateAck = RestoreHostSuccess | RoomError;

export interface ParsedRoomUrl {
  roomId: string | null;
  hostToken: string | null;
}
