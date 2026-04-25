/**
 * 核心规则常量（MVP 版）。
 * 注意：这里只放参数，不放逻辑；逻辑归 engine/。
 */

import type { PlayerId, RouteType } from "../types";
import type { Direction } from "../types";

export const BOARD_ROWS = 4 as const;
export const BOARD_COLS = 4 as const;

export const FINISH_CELL = { row: 0, col: BOARD_COLS - 1 } as const;
export const FINISH_OPENINGS: Direction[] = ["left", "down"];

export const HAND_LIMIT = 3 as const;

export const PLAYERS: Record<PlayerId, { name: string }> = {
  red: { name: "红方" },
  blue: { name: "蓝方" },
};

/**
 * MVP 卡池：只放路线牌（不引入 DTD，避免过早复杂化）。
 */
export const ROUTE_DECK: Array<{ routeType: RouteType; count: number }> = [
  { routeType: "straight", count: 8 },
  { routeType: "turn", count: 8 },
  { routeType: "tee", count: 4 },
  { routeType: "cross", count: 2 },
];

/**
 * MVP 地标：每方 5 个 + 5 空白（共 15 个隐藏内容，右上角为 Finish）。
 * label 先用名称占位，后续接入图片资源映射。
 */
export const LANDMARK_LABELS = ["火山", "木屋", "篝火", "淡水湖", "山洞"] as const;

/**
 * 最小可用胜利阈值：
 * 当前行动方若存在 >=3 个己方地标与 Finish 连通，则获得“可宣布胜利”的资格。
 * 真正胜利仍需手动宣告，并从当前连通路线网络中翻验 3 张牌。
 */
export const WIN_CONNECTED_LANDMARKS = 3 as const;
