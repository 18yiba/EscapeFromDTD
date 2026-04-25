/**
 * engine 对外出口。具体实现拆分在 `gameEngine.ts`，避免逻辑长期堆在 index。
 */

export { applyAction, initializeGame } from "./gameEngine";

