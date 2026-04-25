/**
 * utils/
 * 通用工具函数（与业务规则无关），例如：数组处理、坐标转换、BFS/图搜索等。
 * engine/ 可以调用 utils/，但 utils/ 不应该反过来依赖 engine/。
 */

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export * from "./pathfinding";
export * from "./random";

