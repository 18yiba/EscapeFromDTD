import type { PlayerId } from "../types";
import type { OnlinePlayerId, OnlinePlayerRole } from "./types";

export function getLocalPlayerId(role: OnlinePlayerRole): OnlinePlayerId {
  return role === "host" ? "player1" : "player2";
}

export function getLocalPlayerColor(role: OnlinePlayerRole): PlayerId {
  return role === "host" ? "red" : "blue";
}

export function getPlayerIdColor(playerId: OnlinePlayerId): PlayerId {
  return playerId === "player1" ? "red" : "blue";
}

export function getRoleLabel(role: OnlinePlayerRole) {
  return role === "host" ? "Host / 红方" : "Guest / 蓝方";
}

export function getColorLabel(playerId: PlayerId) {
  return playerId === "red" ? "红方" : "蓝方";
}
