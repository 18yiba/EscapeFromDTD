# 前端与教程规划文档

本文档用于维护 v1.0 在线联机版本的前端架构、用户流程与教程系统规划。

## 文档元信息

| 版本 | 日期 | 完成情况 | 来源 |
| --- | --- | --- | --- |
| v1.0 | 2026-05-08 | 进行中 | `03_USER_FLOW.md` / `08_FRONTEND_ARCHITECTURE.md` / `10_TUTORIAL_SYSTEM.md` |

## 用户流程

This document defines the intended player flow for the v1.0 online multiplayer version, from landing and onboarding through room creation, matchmaking, gameplay, result review, and return sessions.

### Host 创建房间流程

1. Host 在 Landing 点击“双人对战”。
2. 前端连接 Socket.io 并触发 `room:create`。
3. 房间服务返回 `roomId` 和 `hostToken`。
4. 前端保存 `dtd_room_session`，并展示普通邀请链接、房主恢复链接和复制反馈。
5. Host 直接进入游戏界面，背后显示当前棋盘布局，前景显示联机等待遮罩。
6. Host/Guest 均准备后，Host 点击“开始游戏”进入教程遮罩。
7. 双方都确认教程后，房间进入 `playing`，遮罩关闭。

### Guest 受邀加入流程

1. Guest 打开 `/room/:roomId` 或 `?roomId=xxx` 邀请链接。
2. 前端识别 Room ID。
3. 如果 URL 或 localStorage 可恢复 Host，则先执行 Host 恢复。
4. 如果不能恢复 Host，则触发 `room:join` 作为普通 Guest 加入。
5. Guest 加入后直接进入游戏界面，前景显示联机等待遮罩。
6. Guest 准备后等待 Host 开始游戏。
7. 教程遮罩出现后点击“我已了解，进入游戏”，等待双方确认。

## 前端架构

This document describes the frontend architecture for the v1.0 online multiplayer version, including page structure, component boundaries, state management, server communication, and separation from engine logic.

### 基础架构任务

- 新增 `src/online/`，封装 Socket.io client、Room ID 解析、联机类型。
- 新增独立 online store，维护 `roomId`、`role`、`roomStatus`、`players`、`inviteUrl`、`hostRecoveryUrl`、`connectionStatus` 和错误信息。
- online store 只管理房间状态，不写入 engine 规则逻辑。
- `App` 负责识别 URL Room ID、触发自动入房或 Host 恢复，并在进入房间后初始化现有本地游戏界面作为背景。
- `room.gameState` 是联机模式唯一游戏状态来源；Host 只在缺失时初始化，Guest 只读取。
- 联机模式玩家映射固定为 Host/红方、Guest/蓝方，非当前回合禁用操作并提示等待对方行动。
- Landing 的“AI 对战”继续走现有本地 AI 流程。
- Landing 的“双人对战”改为创建联机房间，不再直接启动本地 hotseat。

### 当前实现状态

- `src/online/`、online store、URL 入房、Host 恢复、邀请链接、房主恢复链接已接入。
- 进入房间后直接渲染游戏界面，等待、准备、开始教程和教程确认通过游戏界面遮罩完成。
- `waiting` 与 `tutorial` 阶段通过 online lock 禁用棋盘、手牌和操作按钮。
- 联机模式显示当前身份与当前回合，Host 显示红方，Guest 显示蓝方。
- 联机模式已接入房间级 `gameState` hydrate，Guest 不再独立初始化游戏。
- 本地 AI 入口仍保留原流程，不受联机入口影响。

### 房间恢复与本地存储

前端保存当前 Host session：

```ts
localStorage key: "dtd_room_session"

{
  roomId: string;
  role: "host";
  hostToken: string;
  createdAt: number;
}
```

恢复优先级：

1. URL 中有 `hostToken` 时，优先用 `room:restore_host` 恢复 Host。
2. URL 中没有 `hostToken` 时，再读取 localStorage 中同一 `roomId` 的 Host session。
3. 二者都没有时，不能恢复为 Host，只作为 Guest 加入或返回联机大厅。

链接展示：

- 复制邀请链接：给 Guest 使用，不包含 `hostToken`，格式为 `/room/:roomId`。
- 复制房主恢复链接：给 Host 自己保存，包含 `hostToken`，格式为 `/room/:roomId?hostToken=xxxx`。

### 美化渲染任务

- Landing 双人入口需要覆盖创建中、创建成功、复制成功、创建失败状态。
- 联机等待与教程流程整合到游戏界面遮罩中，不再使用独立等待页。
- 遮罩需要展示 `waiting`、`tutorial`、`playing` 的稳定过渡 UI。
- `waiting` 与 `tutorial` 阶段通过 online lock 禁用棋盘、手牌和操作按钮。
- 邀请链接展示与复制反馈应保持当前温暖地图视觉，不影响 AI 入口。
- Guest 教程弹窗应移动端适配，不能遮挡或破坏正式棋盘布局。
- 不引入复杂动画，仅保留轻量状态反馈。

## 教程系统

教程系统在当前联机等待流程中使用占位内容先行接入。Host 点击开始游戏后，Host 和 Guest 两端都进入 `tutorial` 遮罩；双方都点击“我已了解，进入游戏”后，房间进入 `playing`。

当前教程遮罩流程已接入；教程内容仍为占位/基础规则说明，正式图文教程素材未完成。

This document plans the tutorial system for the v1.0 online multiplayer version, including first-time guidance, rule explanation, progressive hints, practice flow, and non-intrusive onboarding principles.

### Guest 初次入房教程

教程对 Host 和 Guest 同时触发，双方均需确认后才能进入游戏。

教程以图文切换 Overlay Modal 呈现，内容由配置数据驱动，组件只负责渲染和完成回调，不承载游戏规则逻辑。

最低页面内容：

- 基础操作：查看地标、选择路线牌、旋转并放置路线。
- 攻击/干扰：说明 DTD 卡可造成跳过、路线旋转、隐藏内容交换等干扰。
- 生理指标目标：提醒玩家关注方向压力、记忆负荷、路线规划信心等指标。

完成条件：

- Host 和 Guest 都点击完成按钮。
- 前端发送 `room:set_tutorial_ready`。
- 服务端切换房间至 `playing`。

### 新手指引弹窗视觉规范

本节仅参考用户提供的 HTML 中“新手教程弹窗”部分，不参考其中的游戏主界面、顶部导航、右侧边栏、联机面板或手牌区布局。

弹窗定位：

- 作为 Host 和 Guest 正式开始前的 Overlay Modal。
- 用于在正式回合开始前完成基础教学。
- 只负责内容展示、页签切换和完成触发，不承载游戏规则判断。

视觉风格：

- 背景遮罩使用低透明黑色蒙层，可加入轻量 `blur`，保持柔和不压迫。
- 弹窗卡片使用白色背景、大圆角、居中布局和柔和绿色阴影。
- 主色延续 DTD 原生 UI：米白背景、森林绿按钮、浅色边框、深灰正文。
- 教学图片区域使用浅灰或米白底、圆角、细边框，可先放置“原生绘本风教学图”占位。
- 主按钮使用森林绿背景、白色文字、全宽布局、圆角样式，文案为“我已了解，开始战斗”。

内容结构：

- 标题：`逃出地图岛指南`。
- 页签：`翻牌机制`、`放置路线`、`胜利目标`、`DTD卡牌规则`。
- 每个页签包含一张教学图或占位图，以及一段简短说明文字。
- 正文应保持短段落和高可读性，允许换行展示关键说明。

交互要求：

- Guest 可在四个页签之间切换教学内容。
- 点击完成按钮后记录当前玩家 `tutorialReady: true`，双方确认后关闭遮罩。
- 不引入复杂动画，只保留必要的 hover 或状态反馈。

后续素材要求：

- 第一版可使用占位教学图。
- 后续替换为与《逃出地图岛》风格一致的原生绘本风图片。
- 图片内容应服务于教程理解，不应引入新的玩法暗示。

## 翻牌呈现修复状态

- 联机 `inspectCell` 已恢复本端和对端的临时查看显示。
- 临时查看结果通过 online room 的 `lastInspection` 同步，不改变 engine 中查看动作的规则结果。
- 未翻开的 `hidden` 内容只在临时查看、复盘或调试展示场景显示，不作为常规棋盘内容暴露。
- `BoardGrid` 常规显示优先级为临时查看结果、已 reveal 内容、复盘/调试 hidden 内容、卡背占位。
