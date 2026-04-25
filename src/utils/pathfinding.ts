/**
 * 路径与端口匹配相关工具函数（纯逻辑）。
 */

import { FINISH_OPENINGS, BASE_ROUTE_OPENINGS } from "../constants";
import type { BoardState, CellState, Direction, PlayerId, Rotation } from "../types";

const CLOCKWISE: Direction[] = ["up", "right", "down", "left"];

export function rotateDirection(direction: Direction, rotation: Rotation): Direction {
  const idx = CLOCKWISE.indexOf(direction);
  return CLOCKWISE[(idx + rotation) % 4];
}

export function getRouteOpenings(routeType: keyof typeof BASE_ROUTE_OPENINGS, rotation: Rotation): Direction[] {
  return BASE_ROUTE_OPENINGS[routeType].map((d) => rotateDirection(d, rotation));
}

export function getCellOpenings(cell: CellState): Direction[] {
  if (cell.kind === "finish") return FINISH_OPENINGS;
  if (!cell.route) return [];
  return getRouteOpenings(cell.route.routeType, cell.route.rotation);
}

export function getOpposite(direction: Direction): Direction {
  if (direction === "up") return "down";
  if (direction === "down") return "up";
  if (direction === "left") return "right";
  return "left";
}

export function getNeighbor(board: BoardState, row: number, col: number, direction: Direction): CellState | null {
  const offset =
    direction === "up"
      ? [-1, 0]
      : direction === "right"
      ? [0, 1]
      : direction === "down"
      ? [1, 0]
      : [0, -1];
  const nr = row + offset[0];
  const nc = col + offset[1];
  if (nr < 0 || nr >= board.rows || nc < 0 || nc >= board.cols) return null;
  return board.cells[nr * board.cols + nc] ?? null;
}

/**
 * BFS：从 Finish 出发，沿“端口双向匹配”的边扩展，返回所有可达 cellId。
 */
export function bfsReachableFromFinish(board: BoardState): Set<number> {
  const finish = board.cells.find((cell) => cell.kind === "finish");
  if (!finish) return new Set<number>();

  const visited = new Set<number>([finish.id]);
  const queue: number[] = [finish.id];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = board.cells[currentId];
    const openings = getCellOpenings(current);

    for (const direction of openings) {
      const neighbor = getNeighbor(board, current.row, current.col, direction);
      if (!neighbor) continue;
      const opposite = getOpposite(direction);
      const neighborOpenings = getCellOpenings(neighbor);
      if (!neighborOpenings.includes(opposite)) continue;
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        queue.push(neighbor.id);
      }
    }
  }

  return visited;
}

export function countConnectedLandmarks(board: BoardState, playerId: PlayerId): number {
  const connected = bfsReachableFromFinish(board);
  let count = 0;
  for (const cell of board.cells) {
    if (!connected.has(cell.id) || cell.kind === "finish" || !cell.hidden) continue;
    if (cell.hidden.kind === "landmark" && cell.hidden.owner === playerId) {
      count += 1;
    }
  }
  return count;
}

export function getConnectedLandmarkCellIds(board: BoardState, playerId: PlayerId): number[] {
  const connected = bfsReachableFromFinish(board);
  const landmarkCellIds: number[] = [];

  for (const cell of board.cells) {
    if (!connected.has(cell.id) || cell.kind === "finish" || !cell.hidden) continue;
    if (cell.hidden.kind === "landmark" && cell.hidden.owner === playerId) {
      landmarkCellIds.push(cell.id);
    }
  }

  return landmarkCellIds;
}

export function getConnectedNetworkCandidateCellIds(board: BoardState): number[] {
  const connected = bfsReachableFromFinish(board);
  const candidateCellIds: number[] = [];

  for (const cell of board.cells) {
    if (!connected.has(cell.id) || cell.kind === "finish" || !cell.hidden) continue;
    candidateCellIds.push(cell.id);
  }

  return candidateCellIds;
}
