Original prompt: 接入 AI 对战模式基础能力：开局模式选择，hotseat 保持不变，ai 模式下 blue 由 AI 自动执行简单行动并回到 red，包含 aiMemory 上限 5，不改 DTD/BFS/胜负规则。

Progress:
- Added GameMode and AI memory fields to GameState.
- Added pure AI v1 decision helper and memory helper under engine.
- Wired store-level AI turn orchestration after human endTurn.
- Added landing mode selection and in-game mode/turn labels.
- Verified npm run build passes.
- Added return-to-mode-select action and in-game symbol back button.
- Verified npm run build passes after return button change.
- Upgraded AI v1 with limited-memory decision rules, DTD constraints, memory decay, and 3s thinking delay.
- Verified npm run build passes after limited-memory AI upgrade.

TODO:
- Optional future work: add a small deterministic test seam for AI decisions if route placement rules become stricter.
