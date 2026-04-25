/**
 * 路线牌的“基准端口定义”（rotation = 0）。
 * 旋转换算在 utils/pathfinding.ts 中完成。
 */

import type { Direction, RouteType } from "../types";

export const BASE_ROUTE_OPENINGS: Record<RouteType, Direction[]> = {
  straight: ["up", "down"],
  turn: ["up", "right"],
  tee: ["up", "left", "right"],
  cross: ["up", "right", "down", "left"],
};

