import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT || process.env.ROOM_SERVER_PORT || 3001);
const DEFAULT_CLIENT_ORIGINS = ["http://localhost:5173", "https://escapefromdtd.onrender.com"];
const configuredClientOrigins = String(process.env.CLIENT_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const CLIENT_ORIGINS = Array.from(new Set([...DEFAULT_CLIENT_ORIGINS, ...configuredClientOrigins]));
const ROOM_ID_LENGTH = 6;
const INSPECTION_REVEAL_DURATION_MS = 3000;

const httpServer = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: true, service: "dtd-room-server" }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ ok: false, error: "Not found" }));
});
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

function createRoomId() {
  let roomId = "";
  do {
    roomId = randomBytes(4).toString("hex").slice(0, ROOM_ID_LENGTH).toUpperCase();
  } while (rooms.has(roomId));
  return roomId;
}

function createToken() {
  return randomUUID();
}

function createPlayer({ socketId, role, displayName, userId }) {
  return {
    socketId,
    userId,
    role,
    playerId: role === "host" ? "player1" : "player2",
    displayName: displayName || (role === "host" ? "Host" : "Guest"),
    connected: true,
    ready: false,
    tutorialReady: false,
  };
}

function getOnlinePlayerId(role) {
  return role === "host" ? "player1" : "player2";
}

function serializeRoom(record) {
  return record.room;
}

function emitRoomState(record) {
  io.to(record.room.roomId).emit("room:state", serializeRoom(record));
}

function upsertPlayer(record, player) {
  const index = record.room.players.findIndex((candidate) => candidate.role === player.role);
  if (index >= 0) {
    record.room.players[index] = {
      ...record.room.players[index],
      socketId: player.socketId,
      userId: player.userId,
      role: player.role,
      playerId: player.playerId,
      displayName: player.displayName,
      connected: true,
    };
  } else {
    record.room.players.push(player);
  }
  record.room.updatedAt = Date.now();
}

function getPlayer(record, role) {
  return record.room.players.find((player) => player.role === role);
}

function getRoomFromPayload(payload) {
  const roomId = String(payload.roomId ?? "").trim().toUpperCase();
  return { roomId, record: rooms.get(roomId) };
}

function isAuthorized(record, payload) {
  if (payload.role === "host") return record.hostToken === String(payload.token ?? "");
  if (payload.role === "guest") return record.guestTokens.has(String(payload.token ?? ""));
  return false;
}

function isRoleActionOwner(payload) {
  return payload.by === getOnlinePlayerId(payload.role);
}

function areBothPlayersReady(record) {
  const host = getPlayer(record, "host");
  const guest = getPlayer(record, "guest");
  return Boolean(host?.connected && host.ready && guest?.connected && guest.ready);
}

function areBothPlayersTutorialReady(record) {
  const host = getPlayer(record, "host");
  const guest = getPlayer(record, "guest");
  return Boolean(host?.tutorialReady && guest?.tutorialReady);
}

function updatePlayerFlag({ payload, ack, update }) {
  const { record } = getRoomFromPayload(payload);
  if (!record) {
    ack?.({ ok: false, error: "房间不存在，请检查邀请码。" });
    return;
  }
  if (!isAuthorized(record, payload)) {
    ack?.({ ok: false, error: "房间身份验证失败，请重新进入房间。" });
    return;
  }
  const player = getPlayer(record, payload.role);
  if (!player) {
    ack?.({ ok: false, error: "玩家席位不存在，请重新加入房间。" });
    return;
  }
  update(record, player);
  record.room.updatedAt = Date.now();
  ack?.({ ok: true, room: serializeRoom(record) });
  emitRoomState(record);
}

io.on("connection", (socket) => {
  socket.on("room:create", (payload = {}, ack) => {
    const roomId = createRoomId();
    const hostToken = createToken();
    const now = Date.now();
    const room = {
      roomId,
      roomStatus: "waiting",
      players: [createPlayer({ socketId: socket.id, role: "host", displayName: payload.displayName, userId: payload.userId })],
      gameSeed: randomUUID(),
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
    const record = {
      hostToken,
      guestTokens: new Map(),
      room,
    };

    rooms.set(roomId, record);
    socket.join(roomId);

    ack?.({ ok: true, roomId, hostToken, inviteUrl: `/room/${roomId}`, room: serializeRoom(record) });
    emitRoomState(record);
  });

  socket.on("room:join", (payload = {}, ack) => {
    const { roomId, record } = getRoomFromPayload(payload);
    if (!record) {
      ack?.({ ok: false, error: "房间不存在，请检查邀请码。" });
      return;
    }

    const guestToken = createToken();
    record.guestTokens.set(guestToken, socket.id);
    socket.join(roomId);
    upsertPlayer(record, createPlayer({ socketId: socket.id, role: "guest", displayName: payload.displayName, userId: payload.userId }));

    ack?.({ ok: true, guestToken, room: serializeRoom(record) });
    emitRoomState(record);
  });

  socket.on("room:restore_host", (payload = {}, ack) => {
    const { roomId, record } = getRoomFromPayload(payload);
    const hostToken = String(payload.hostToken ?? "");
    if (!record || record.hostToken !== hostToken) {
      ack?.({ ok: false, error: "无法恢复房主身份，请检查房主恢复链接。" });
      return;
    }

    socket.join(roomId);
    upsertPlayer(record, createPlayer({ socketId: socket.id, role: "host", displayName: payload.displayName, userId: payload.userId }));

    ack?.({ ok: true, room: serializeRoom(record) });
    emitRoomState(record);
  });

  socket.on("room:set_ready", (payload = {}, ack) => {
    updatePlayerFlag({
      payload,
      ack,
      update: (_record, player) => {
        if (_record.room.roomStatus !== "waiting") return;
        player.ready = Boolean(payload.ready);
      },
    });
  });

  socket.on("room:start_tutorial", (payload = {}, ack) => {
    const { record } = getRoomFromPayload(payload);
    if (!record) {
      ack?.({ ok: false, error: "房间不存在，请检查邀请码。" });
      return;
    }
    if (record.hostToken !== String(payload.hostToken ?? "")) {
      ack?.({ ok: false, error: "只有房主可以开始游戏。" });
      return;
    }
    if (!areBothPlayersReady(record)) {
      ack?.({ ok: false, error: "Host 和 Guest 都准备后才能开始游戏。" });
      return;
    }

    record.room.roomStatus = "tutorial";
    record.room.players = record.room.players.map((player) => ({ ...player, tutorialReady: false }));
    record.room.updatedAt = Date.now();
    ack?.({ ok: true, room: serializeRoom(record) });
    emitRoomState(record);
  });

  socket.on("room:set_tutorial_ready", (payload = {}, ack) => {
    updatePlayerFlag({
      payload,
      ack,
      update: (record, player) => {
        if (record.room.roomStatus !== "tutorial") return;
        player.tutorialReady = Boolean(payload.tutorialReady);
        if (areBothPlayersTutorialReady(record)) {
          record.room.roomStatus = "playing";
        }
      },
    });
  });

  socket.on("room:init_game", (payload = {}, ack) => {
    const { record } = getRoomFromPayload(payload);
    if (!record) {
      ack?.({ ok: false, error: "房间不存在，请检查邀请码。" });
      return;
    }
    if (record.hostToken !== String(payload.hostToken ?? "")) {
      ack?.({ ok: false, error: "只有房主可以初始化联机对局。" });
      return;
    }
    if (record.room.gameState) {
      ack?.({ ok: true, room: serializeRoom(record) });
      return;
    }
    if (!payload.gameState) {
      ack?.({ ok: false, error: "缺少初始游戏状态。" });
      return;
    }

    record.room.gameState = payload.gameState;
    record.room.version = 0;
    record.room.updatedAt = Date.now();
    ack?.({ ok: true, room: serializeRoom(record) });
    emitRoomState(record);
  });

  socket.on("room:submit_game_state", (payload = {}, ack) => {
    const { record } = getRoomFromPayload(payload);
    if (!record) {
      ack?.({ ok: false, error: "房间不存在，请检查邀请码。" });
      return;
    }
    if (record.room.roomStatus !== "playing") {
      ack?.({ ok: false, error: "房间尚未进入正式游戏。" });
      return;
    }
    if (!isAuthorized(record, payload) || !isRoleActionOwner(payload)) {
      ack?.({ ok: false, error: "房间身份验证失败，请重新进入房间。" });
      return;
    }
    if (payload.baseVersion !== record.room.version) {
      ack?.({ ok: false, error: "房间状态已更新，请等待同步后重试。" });
      return;
    }
    if (!payload.nextGameState) {
      ack?.({ ok: false, error: "缺少同步游戏状态。" });
      return;
    }

    record.room.gameState = payload.nextGameState;
    record.room.version += 1;
    record.room.lastAction = {
      by: payload.by,
      type: String(payload.actionType ?? "unknown"),
      at: Date.now(),
    };
    if (payload.inspection?.content && typeof payload.inspection.cellId === "number") {
      const now = Date.now();
      record.room.lastInspection = {
        by: payload.by,
        cellId: payload.inspection.cellId,
        content: payload.inspection.content,
        at: now,
        expiresAt: now + INSPECTION_REVEAL_DURATION_MS,
      };
    }
    record.room.updatedAt = Date.now();
    ack?.({ ok: true, room: serializeRoom(record) });
    emitRoomState(record);
  });

  socket.on("disconnect", () => {
    rooms.forEach((record) => {
      let changed = false;
      record.room.players = record.room.players.map((player) => {
        if (player.socketId !== socket.id) return player;
        changed = true;
        return { ...player, connected: false };
      });
      if (changed) {
        record.room.updatedAt = Date.now();
        emitRoomState(record);
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`DTD room server listening on http://localhost:${PORT}`);
});
