/**
 * Board 渲染组件（只展示，不做规则判定）。
 */

import type { BoardState } from "../types";

type TemporaryInspectedLandmark = {
  owner: "red" | "blue";
  label: string;
};

export function BoardGrid({
  board,
  selectedCellId,
  temporaryInspectedLandmarks,
  displayMode = "inGame",
  highlightedCellIds = [],
  connectedCellIds = [],
  claimSelectedCellIds = [],
  onSelectCell,
}: {
  board: BoardState;
  selectedCellId: number | null;
  temporaryInspectedLandmarks: Record<number, TemporaryInspectedLandmark>;
  displayMode?: "inGame" | "review";
  highlightedCellIds?: number[];
  connectedCellIds?: number[];
  claimSelectedCellIds?: number[];
  onSelectCell: (cellId: number) => void;
}) {
  return (
    <div
      className="grid max-h-full w-full max-w-full gap-1.5 sm:gap-2"
      style={{
        gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
      }}
    >
      {board.cells.map((cell) => {
        const isSelected = selectedCellId === cell.id;
        const temporaryInspectedLandmark = temporaryInspectedLandmarks[cell.id];
        const isHighlighted = highlightedCellIds.includes(cell.id);
        const isConnected = connectedCellIds.includes(cell.id);
        const isClaimSelected = claimSelectedCellIds.includes(cell.id);
        const visibleLandmark =
          displayMode === "review" && cell.hidden?.kind === "landmark"
            ? { owner: cell.hidden.owner, label: cell.hidden.label }
            : cell.revealed.kind === "landmark"
            ? { owner: cell.revealed.owner, label: cell.revealed.label }
            : null;
        return (
          <button
            key={cell.id}
            type="button"
            onClick={() => onSelectCell(cell.id)}
            className={[
              "aspect-square rounded-lg border text-left text-xs transition",
              "bg-slate-50 hover:bg-slate-100",
              isSelected ? "border-slate-900" : "border-slate-200",
              isConnected ? "bg-emerald-50" : "",
              isClaimSelected ? "ring-2 ring-amber-500" : "",
              isHighlighted ? "border-emerald-600" : "",
            ].join(" ")}
          >
            <div className="flex h-full flex-col justify-between p-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {String.fromCharCode(65 + cell.row)}
                  {cell.col + 1}
                </div>
                {cell.kind === "finish" && <div className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">FIN</div>}
              </div>
              <div className="space-y-1 text-[10px] text-slate-600">
                {cell.route
                  ? `路线:${cell.route.routeType} r${cell.route.rotation}`
                  : visibleLandmark
                  ? `地标:${visibleLandmark.owner === "red" ? "红" : "蓝"}-${visibleLandmark.label}`
                  : "—"}
                {temporaryInspectedLandmark && (
                  <div className="rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900">
                    地标:{temporaryInspectedLandmark.owner === "red" ? "红" : "蓝"}-{temporaryInspectedLandmark.label}
                  </div>
                )}
                {isHighlighted && <div className="text-[10px] text-sky-700">可验证</div>}
                {isConnected && <div className="text-[10px] text-emerald-700">已连通</div>}
                {isClaimSelected && <div className="text-[10px] text-amber-700">验证选择</div>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
