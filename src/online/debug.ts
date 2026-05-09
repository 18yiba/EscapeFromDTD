import { getLocalPlayerColor, getLocalPlayerId } from "./playerMapping";
import type { CellState } from "../types";
import type { OnlinePlayerRole, OnlineRoomState } from "./types";

export function debugOnlineRoom(event: string, room: OnlineRoomState | null, role: OnlinePlayerRole | null) {
  if (!import.meta.env.DEV || !room || !role) return;
  const localPlayerId = getLocalPlayerId(role);
  const localPlayerColor = getLocalPlayerColor(role);
  console.info("[online-room]", event, {
    roomId: room.roomId,
    localRole: role,
    localPlayerId,
    localPlayerColor,
    roomStatus: room.roomStatus,
    currentTurn: room.gameState?.currentTurn,
    version: room.version,
  });
}

export function debugOnlineInspection({
  actionType,
  cellId,
  beforeCell,
  afterCell,
  version,
}: {
  actionType: string;
  cellId: number;
  beforeCell: CellState | undefined;
  afterCell: CellState | undefined;
  version: number;
}) {
  if (!import.meta.env.DEV) return;
  console.info("[online-inspection]", {
    actionType,
    cellId,
    beforeHidden: beforeCell?.hidden,
    beforeRevealed: beforeCell?.revealed,
    afterHidden: afterCell?.hidden,
    afterRevealed: afterCell?.revealed,
    roomVersion: version,
  });
}
