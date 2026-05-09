import type { ParsedRoomUrl } from "./types";

export function normalizeRoomId(roomId: string) {
  return roomId.trim().replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
}

export function parseRoomUrl(location: Location = window.location): ParsedRoomUrl {
  const searchParams = new URLSearchParams(location.search);
  const queryRoomId = searchParams.get("roomId");
  const hostToken = searchParams.get("hostToken");
  const roomPathMatch = location.pathname.match(/^\/room\/([^/]+)$/);
  const pathRoomId = roomPathMatch?.[1] ?? null;
  const roomId = pathRoomId ?? queryRoomId;

  return {
    roomId: roomId ? normalizeRoomId(roomId) : null,
    hostToken,
  };
}

export function buildInvitePath(roomId: string) {
  return `/room/${normalizeRoomId(roomId)}`;
}

export function buildInviteUrl(roomId: string, origin: string = window.location.origin) {
  return `${origin}${buildInvitePath(roomId)}`;
}

export function buildHostRecoveryUrl(roomId: string, hostToken: string, origin: string = window.location.origin) {
  const url = new URL(buildInvitePath(roomId), origin);
  url.searchParams.set("hostToken", hostToken);
  return url.toString();
}

export function pushRoomUrl(roomId: string) {
  window.history.pushState({}, "", buildInvitePath(roomId));
}

export function pushLandingUrl() {
  window.history.pushState({}, "", "/");
}
