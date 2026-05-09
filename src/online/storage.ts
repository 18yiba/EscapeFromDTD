import type { StoredRoomSession } from "./types";

export const ROOM_SESSION_STORAGE_KEY = "dtd_room_session";

export function readStoredRoomSession(): StoredRoomSession | null {
  try {
    const raw = window.localStorage.getItem(ROOM_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRoomSession;
    if (!parsed.roomId || !parsed.role || !parsed.createdAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredRoomSession(session: StoredRoomSession) {
  window.localStorage.setItem(ROOM_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredRoomSession() {
  window.localStorage.removeItem(ROOM_SESSION_STORAGE_KEY);
}
