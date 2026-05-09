# 路线图与发布记录

本文档用于维护项目路线图、版本状态、发布记录与后续维护说明。

## 文档元信息

| 版本 | 日期 | 完成情况 | 来源 |
| --- | --- | --- | --- |
| v0.8.x | 2026-04-30 | 已完成 | `beta_summary_v0.8.md` |
| v0.9.0 | 未在原文注明；整理日期 2026-05-08 | landing page 已完成；UI 视觉规范草案 | `v0.9-landing-page-ui-requirements.md` / `v0.9-ui-visual-guidelines.md` |
| v1.0 | 2026-05-08 | 进行中 | `11_ROADMAP.md` / `12_RELEASE_NOTES.md` |

## v1.0 路线图

This document tracks the development roadmap from the current prototype toward the v1.0 online multiplayer release, including milestones, priorities, dependencies, and release readiness criteria.

### 当前拆解：联机 MVP 完成状态清单

1. Node.js + Socket.IO 内存房间服务：已完成 MVP。
2. 匿名创建房间、邀请码加入、URL 自动入房：已完成。
3. Host localStorage + URL `hostToken` 双重恢复：已完成。
4. 游戏界面遮罩等待、准备、开始教程和教程确认：已完成。
5. Host/Guest 身份映射与回合同步：已完成。
6. 房间级 `gameState` 同步：已完成 MVP。
7. 联机翻牌临时呈现同步：已完成。
8. `npm run build` 验证：已通过。
9. Render 生产部署配置：未完成。
10. 持久化数据库/Redis：未完成。
11. 登录、匹配、战绩系统：未完成。

### 验收标准

- Landing 点击“双人对战”创建联机房间，而不是直接开始本地双人。
- Host 能看到并复制邀请链接。
- Host 能看到并复制房主恢复链接。
- Guest 打开邀请链接自动进入同一 Room ID。
- Guest 可通过输入邀请码加入房间。
- Host 在同浏览器可通过 localStorage 恢复；在不同浏览器可通过带 `hostToken` 的恢复链接恢复。
- 进入房间后直接显示游戏界面，等待和教程都通过遮罩完成。
- Host/Guest 都准备后，Host 可以开始教程。
- Host/Guest 都确认教程后，遮罩关闭，房间进入 `playing`。
- Host/Guest 共享同一个 `room.gameState`，合法行动后另一端通过 `room:state` 同步更新。
- Host 固定为红方，Guest 固定为蓝方，非当前回合不可操作。
- 联机查看地标后，本端和对端均可短暂显示同一查看结果。
- Host/Guest 跨浏览器和跨设备同步依赖公网 Socket.IO 后端。
- 当前上传 GitHub 后如只部署前端，不能真实联机。
- Render 方案推荐继续使用 Socket.IO + Render 后端作为 MVP 最小上线方案。
- AI 对战入口仍可启动本地 AI 对局。
- 不修改核心游戏规则与路径判定逻辑。

## v1.0 发布记录

This document records release notes for the project, including shipped changes, compatibility notes, known issues, verification status, and maintenance history for future versions.

### 2026-05-09 当前会话记录

- 已完成匿名联机房间 MVP：创建房间、邀请码加入、URL 自动入房、Host 恢复链接、Guest 邀请链接和本地 session 保存。
- 已完成游戏界面内联机遮罩流程：waiting 准备、tutorial 教程确认、playing 遮罩关闭。
- 已完成最小联机对战同步：Host/Guest 固定阵营、共享 `room.gameState`、行动后通过 `room:state` 广播同步。
- 已完成联机 `inspectCell` 临时翻牌呈现修复：本端立即显示，对端通过 `lastInspection` 同步显示。
- 已确认当前真实跨设备联机需要部署 Socket.IO 房间服务；仅部署前端静态站点无法完成同步。
- 已知限制：房间状态仍在服务端内存 `rooms = new Map()`，服务重启会丢失房间，生产持久化和多实例共享未完成。

## 历史版本状态

| 版本 | 完成情况 | 说明 |
| --- | --- | --- |
| v0.8.x | 已完成 | Beta 前阶段总结已迁移至 `01_PRODUCT_ARCHITECTURE.md`。 |
| v0.9.0 landing page | 已完成 | landing page 需求已迁移至 `02_UI_UX_GUIDELINES.md`。 |
| v0.9 UI 视觉规范 | 草案 | 视觉规范草案已迁移至 `02_UI_UX_GUIDELINES.md`。 |
| v1.0 在线联机规划 | 联机 MVP 已实现；线上部署与持久化待后续 | 保留最小架构文档，后续继续补充。 |
