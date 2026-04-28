# AGENTS.md

## 项目说明
这是一个 React + TypeScript + Zustand 的前端游戏原型项目。

## 当前阶段
MVP 已完成，进入 UI / 视觉优化阶段。

## 核心约束（必须遵守）
1. 不修改 `engine/` 中的核心游戏逻辑
2. 不修改 BFS、路径判定、胜负规则
3. 不新增游戏玩法（包括 DTD 卡牌）
4. `store` / `engine` / `views` / `components` 必须保持解耦
5. 不将复杂逻辑写入 React 组件

## UI 开发原则
1. 只做视觉优化，不改变行为逻辑
2. 优先优化布局、层级、颜色、可读性
3. 不引入复杂动画，除非明确要求
4. 不进行大规模重构

## 修改原则
1. 小步修改，每次只做一类改动
2. 优先最小改动解决问题
3. 修改后确保：
   - 游戏流程仍可正常运行
   - `npm run build` 通过

## DTD Card Integration Rules

Goal:
Extend the game with DTD cards without breaking existing core systems.

Constraints:
1. DTD card logic must be implemented in `engine/`, not in UI components.
2. UI components may only trigger DTD actions; they must not contain DTD logic.
3. Existing systems must remain stable:
   - route placement
   - BFS connectivity
   - win condition logic
   - turn flow
4. DTD cards must be modeled as part of the game state:
   - deck
   - hand
   - discard pile
5. All DTD effects must be expressed as pure functions in engine.
6. Do not modify BFS or pathfinding logic unless absolutely necessary.
7. Do not introduce visual complexity at this stage.

Scope:
- types
- constants
- engine logic
- minimal store extension

Do NOT:
- redesign UI
- add animations
- implement full UX for DTD cards yet


## AI Player Rules (Preparation)

Goal:
Prepare for AI player without implementing it yet.

Constraints:
1. AI decision logic must be independent from UI.
2. AI must operate on engine state, not component state.
3. AI actions must use the same action system as human players.
4. Do not implement AI inside React components.
5. AI should be pluggable:
   - random strategy (v1)
   - rule-based strategy (v2)
   - scoring-based strategy (v3)

Important:
Do NOT implement AI yet. Only ensure architecture supports it.