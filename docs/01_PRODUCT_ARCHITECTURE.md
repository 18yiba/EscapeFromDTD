# 产品架构文档

本文档用于维护《逃出地图岛（Escape from DTD）》的产品架构、核心规则、技术架构与阶段总结。

## 文档元信息

| 版本 | 日期 | 完成情况 | 来源 |
| --- | --- | --- | --- |
| v0.8.x | 2026-04-30 | 已完成 | `beta_summary_v0.8.md` |
| v1.0 | 2026-05-08 | 进行中 | `01_PRODUCT_ARCHITECTURE.md` / `04_GAME_RULES.md` |

## v1.0 产品架构入口

This document describes the high-level product architecture for the v1.0 online multiplayer version, including product modules, responsibility boundaries, and the relationship between gameplay, frontend, backend, and live operations.

## v1.0 游戏规则入口

This document records the stable game rules and terminology for the v1.0 online multiplayer version, so future UI, backend, tutorial, and multiplayer work can align with the same rule source.

## v0.8 Beta 阶段总结

来源：`beta_summary_v0.8.md`

# 逃出地图岛（Escape from DTD）- Beta 阶段总结
更新日期：2026 年 4 月 30 日

## 1.项目简介
    《逃出地图岛》是一款双人对战的策略类地图构建游戏，玩家通过放置路线牌、探索地标信息，在不完全信息条件下完成路径构建，并达成胜利条件。

    游戏核心体验：
    - 信息不对称博弈
    - 路径构建策略
    - 地标识别与判断

## 2.当前版本：v0.8.x（Beta 前阶段）

    当前版本已完成：
    - 核心规则闭环
    - 可完整进行一局游戏
    - 基本 UI 可操作

    但尚未达到可发布标准，主要问题集中在：
    - UI 体验不完整
    - 规则表达不清晰
    - 部分系统缺失（DTD 卡牌等）

## 3.核心机制
### 3.1 回合机制

    每回合玩家必须在以下行动中选择一种：

    1. 放置路线牌
    2. 查看一个地标

    规则：
    - 行动互斥，不可同时执行
    - 玩家可取消当前选择

### 3.2 路线系统

    - 路线牌可放置于棋盘格中
    - 支持旋转（左旋 / 右旋）
    - 新路线可覆盖旧路线，旧牌返回卡池

    系统使用 BFS 判断路径连通性

### 3.3 地标系统

    - 地标分为不同阵营（红 / 蓝）
    - 初始为隐藏状态
    - 玩家可查看任意地标

    查看机制：
    - 查看行为对对手可见
    - 内容短暂展示后恢复隐藏

### 3.4 胜利机制

    胜利分为三个阶段：

    #### 1. 系统检测
    当满足以下条件时触发：
    - 路线连接至终点
    - 连通路径包含 ≥3 个地标

    #### 2. 玩家宣告
    玩家主动发起胜利宣告

    #### 3. 验证阶段
    - 从连通路径中的地标中选择 3 个
    - 若全部为己方地标 → 胜利
    - 否则 → 宣告失败，游戏结束

### 3.5 信息机制

    本游戏核心为信息不对称：

    - 地标信息默认隐藏
    - 玩家通过“查看”逐步获取信息
    - 对手可观察你的行为，但无法获取内容

    设计目标：
    - 形成心理博弈
    - 提升策略深度

## 5. 技术架构

    - 前端：React + TypeScript
    - 状态管理：Zustand
    - 构建工具：Vite
    - 样式：Tailwind

    核心模块：
    - gameEngine：游戏规则逻辑
    - BoardGrid：棋盘渲染
    - gameStore：状态控制
    - pathfinding：路径连通算法（BFS）

## 6. 已实现功能

    - 双人同屏对战
    - 路线牌放置与旋转
    - 地标查看机制
    - BFS 路径连通检测
    - 胜利宣告与验证流程
    - RuleFeedback 规则反馈
    - 手牌系统（路线牌+DTD 牌）

## 7. 下一阶段目标：v0.9（Beta）

    ### 优先级 P0
    - UI 重构（棋盘为核心）——包括手机端和电脑端的landing page 和 游戏主界面的 ui 设计
    - 游戏规则说明系统
    - 完整游戏流程（开始 / 进行 / 结算）

    ### 优先级 P1
    - 信息反馈优化（动画 / 高亮）

    ### 优先级 P2
    - 视觉风格统一
    - 音效与动画
