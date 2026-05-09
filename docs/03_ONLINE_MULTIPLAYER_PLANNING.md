# 在线联机规划文档

本文档用于维护 v1.0 在线联机版本的多人架构、竞品研究、数据库与 API 规划。

## 文档元信息

| 版本 | 日期 | 完成情况 | 来源 |
| --- | --- | --- | --- |
| v1.0 | 2026-05-08 | 进行中 | `02_COMPETITOR_RESEARCH.md` / `05_ONLINE_MULTIPLAYER_ARCHITECTURE.md` / `06_DATABASE_SCHEMA.md` / `07_API_DESIGN.md` |

## 竞品研究

This document collects competitor analysis and market references for the v1.0 online multiplayer version, helping guide product positioning, feature prioritization, onboarding, retention, and multiplayer experience design.

## 在线多人架构

This document outlines the technical architecture for online multiplayer, including session lifecycle, player connection states, synchronization strategy, server authority, reconnection, and error handling.

### v1.0 MVP 联机目标

- 使用 Node.js + Socket.io 实现轻量房间服务。
- Landing 的“双人对战”入口升级为“创建联机房间/复制邀请链接”入口。
- 邀请链接包含 Room ID；Guest 点击链接后自动进入同一房间。
- 本阶段实现进入游戏界面前的联机房间流程：创建房间、邀请码加入、URL 自动加入、Host 恢复、准备、教程确认和开始游戏遮罩。
- 完整对局动作同步放到后续阶段。
- 不修改 `engine/`、BFS、路径判定、胜负规则或 DTD 玩法逻辑。

### 房间状态机

后端维护独立的 `roomStatus`，避免与现有 engine `GameState.status` 混淆。

```ts
type RoomStatus = "waiting" | "tutorial" | "playing" | "finished";
```

状态含义：

- `waiting`：Host 已创建房间，等待双方连接并准备。
- `tutorial`：Host 点击开始游戏后，双方查看教程并分别确认。
- `playing`：双方 `tutorialReady` 均为 true，遮罩关闭，正式回合可以开始。
- `finished`：预留给后续结算状态。

状态流转：

1. `room:create` 创建房间后进入 `waiting`。
2. Host 和 Guest 分别通过 `room:set_ready` 切换准备状态。
3. 双方都准备后，Host 触发 `room:start_tutorial`，房间进入 `tutorial`。
4. Host 和 Guest 分别触发 `room:set_tutorial_ready`。
5. 双方 `tutorialReady` 均为 true 后，房间进入 `playing`。

### 房间内存模型

当前版本使用内存态，后续可替换为数据库持久化。

```ts
type PlayerRole = "host" | "guest";

interface PlayerSession {
  socketId: string;
  userId?: string;
  role: PlayerRole;
  playerId: "player1" | "player2";
  displayName: string;
  connected: boolean;
  ready: boolean;
  tutorialReady: boolean;
}

interface OnlineRoomState {
  roomId: string;
  roomStatus: RoomStatus;
  players: PlayerSession[];
  gameSeed?: string;
  gameState?: GameState;
  version: number;
  lastAction?: {
    by: "player1" | "player2";
    type: string;
    at: number;
  };
  lastInspection?: {
    by: "player1" | "player2";
    cellId: number;
    content: HiddenContent;
    at: number;
    expiresAt: number;
  };
  createdAt: number;
  updatedAt: number;
}
```

### 最小联机状态同步

当前 MVP 使用客户端权威同步：

- Host 固定为 `player1 / red`，Guest 固定为 `player2 / blue`。
- `gameState` 保存在房间状态中，双方共享同一份 `room.gameState`。
- Host 在 `room.gameState` 不存在时初始化现有 `GameState` 并写入房间。
- Guest 不初始化游戏，只读取并订阅 `room.gameState`。
- 当前行动玩家本地调用现有 engine `applyAction` 生成 `nextGameState`，再提交到房间服务。
- 房间服务校验 token、角色、`roomStatus === "playing"` 和 `baseVersion === room.version` 后写入 `gameState`、递增 `version`，并通过 `room:state` 广播。

### 最小联机状态同步当前实现状态

- Host/Guest 已固定映射为 `host -> player1/red`、`guest -> player2/blue`。
- `room.gameState` 已作为联机模式唯一共享状态源，前端本地 store 只 hydrate 房间中的 `gameState`。
- 行动通过 `room:submit_game_state` 提交，服务端校验 token、role、version 后写入房间并广播 `room:state`。
- `inspectCell` 的临时翻牌呈现通过 `lastInspection` 广播，不修改 engine 翻牌规则，也不把 hidden 内容作为常规棋盘状态暴露。
- 当前实现仍属于客户端权威 MVP：行动端本地调用现有 engine `applyAction`，服务端负责最小身份与版本校验。

### Token 恢复模型

当前不接入登录系统，因此 Host 身份不能只依赖 localStorage。房间服务需要生成私密 token：

- `roomId`：公开邀请码，可放在普通邀请链接中。
- `hostToken`：房主私密 token，只用于恢复 Host 身份。
- `guestToken`：访客私密 token，在 Guest 加入时生成，后续用于访客重连扩展。

前端保存 Host session：

```ts
localStorage key: "dtd_room_session"

{
  roomId: string;
  role: "host";
  hostToken: string;
  createdAt: number;
}
```

Host 恢复优先级：

1. URL 中存在 `hostToken` 时，优先使用 `/room/:roomId?hostToken=xxxx` 恢复 Host。
2. URL 没有 `hostToken` 时，再读取 localStorage 中同一 `roomId` 的 Host session。
3. 二者都不存在时，不能恢复为 Host，只能作为普通 Guest 加入或返回联机大厅。

普通邀请链接不携带 `hostToken`：`/room/:roomId`。
房主恢复链接携带 `hostToken`：`/room/:roomId?hostToken=xxxx`。

### 连接与断线策略

- 当前 MVP 允许匿名加入，`userId` 为预留字段。
- 断线时保留玩家席位并广播 `connected: false`。
- 后续接入 JWT 后，可通过 Socket.io handshake auth 识别用户，并用 `userId` 支持重连恢复。

## 数据库规划

This document plans the database schema for the v1.0 online multiplayer version, covering users, player profiles, rooms, matches, game snapshots, results, audit records, and future operational data.

### 数据库预留

本阶段不落库，但字段设计需支持后续扩展：

- `rooms`：`roomId`、`roomStatus`、创建时间、更新时间。
- `room_players`：`roomId`、`userId`、`role`、连接状态、教程完成状态。
- `match_snapshots`：后续保存 engine `GameState` 快照和动作日志。
- `users`：由后续 JWT 账户体系维护，不阻塞匿名 MVP。

## API 设计

This document defines API design principles and endpoint responsibilities for the v1.0 online multiplayer version, including authentication, matchmaking, room management, gameplay actions, synchronization, and match history.

### Socket.io 事件设计

#### `room:create`

客户端发送：

```ts
{ userId?: string; displayName?: string }
```

服务端 ack：

```ts
{ ok: true; roomId: string; hostToken: string; inviteUrl: string; room: OnlineRoomState }
```

#### `room:join`

客户端发送：

```ts
{ roomId: string; userId?: string; displayName?: string }
```

服务端 ack：

```ts
{ ok: true; guestToken: string; room: OnlineRoomState }
```

失败时返回 `{ ok: false; error: string }`。

#### `room:restore_host`

客户端发送：

```ts
{ roomId: string; hostToken: string; userId?: string; displayName?: string }
```

服务端 ack：

```ts
{ ok: true; room: OnlineRoomState }
```

失败时返回 `{ ok: false; error: string }`。

#### `room:set_ready`

客户端发送：

```ts
{ roomId: string; role: "host" | "guest"; token: string; ready: boolean }
```

#### `room:start_tutorial`

客户端发送：

```ts
{ roomId: string; hostToken: string }
```

#### `room:set_tutorial_ready`

客户端发送：

```ts
{ roomId: string; role: "host" | "guest"; token: string; tutorialReady: boolean }
```

#### `room:init_game`

客户端发送：

```ts
{ roomId: string; hostToken: string; gameState: GameState }
```

#### `room:submit_game_state`

客户端发送：

```ts
{
  roomId: string;
  role: "host" | "guest";
  token: string;
  by: "player1" | "player2";
  baseVersion: number;
  actionType: string;
  nextGameState: GameState;
  inspection?: {
    cellId: number;
    content: HiddenContent;
  };
}
```

#### `room:state`

服务端广播完整 `OnlineRoomState`，用于同步房间阶段、玩家列表和连接状态。

### URL Room ID 识别

- 推荐邀请链接：`/room/:roomId`。
- 兼容查询参数：`?roomId=xxx`。
- 前端识别到 Room ID 后自动执行 `room:join`。

## 部署与共享服务现状

- 当前 Host/Guest 同步依赖 Socket.IO 服务端，不依赖 BroadcastChannel 或同浏览器标签页通信。
- 本地开发默认连接 `VITE_ROOM_SERVER_URL=http://localhost:3001`。
- Render 部署后，前端需要配置 `VITE_ROOM_SERVER_URL` 指向公网 Socket.IO 后端。
- 当前房间状态存在服务端内存 `rooms = new Map()`，服务重启后房间、token 与 `gameState` 会丢失。
- 如果只部署前端静态站点，不部署房间服务，Host 和 Guest 无法完成真实跨设备联机。
- MVP 推荐继续使用 Socket.IO + Render 后端作为最小线上方案；后续如需抗重启或多实例，需要接入 Redis、数据库或托管实时数据库。

## 未完成/后续

- 生产持久化未完成。
- 多实例共享未完成。
- 用户登录、数据库用户系统、匹配系统、战绩系统未完成。
- Render 生产环境变量、健康检查与部署脚本仍待补齐。
