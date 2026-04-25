/**
 * Board 渲染组件（只展示，不做规则判定）。
 */

import { CARD_BACK_IMAGE, FINISH_IMAGE, LANDMARK_IMAGES, ROUTE_CARD_IMAGES } from "../constants";
import type { BoardState } from "../types";
import { CardImage } from "./CardImage";

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
        const displayedLandmark = temporaryInspectedLandmark ?? visibleLandmark;
        const landmarkBorderClass =
          displayedLandmark?.owner === "red"
            ? "border-red-500"
            : displayedLandmark?.owner === "blue"
            ? "border-blue-500"
            : "border-slate-200";
        return (
          <button
            key={cell.id}
            type="button"
            onClick={() => onSelectCell(cell.id)}
            className={[
              "relative aspect-square overflow-hidden rounded-lg border-2 text-left text-xs transition",
              "bg-slate-50 hover:bg-slate-100",
              landmarkBorderClass,
              isSelected ? "ring-2 ring-slate-900 ring-offset-2" : "",
              isConnected ? "bg-emerald-50" : "",
              isClaimSelected ? "ring-2 ring-amber-500 ring-offset-2" : "",
              isHighlighted && !displayedLandmark ? "border-emerald-600" : "",
            ].join(" ")}
          >
            <div className="flex h-full w-full flex-col">
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white/70">
                {cell.route ? (
                  <CardImage
                    src={ROUTE_CARD_IMAGES[cell.route.routeType]}
                    alt={`路线牌 ${cell.route.routeType}`}
                    rotation={cell.route.rotation}
                    className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] text-slate-600"
                    fallback={`路线:${cell.route.routeType} r${cell.route.rotation}`}
                  />
                ) : cell.kind === "finish" ? (
                  <CardImage
                    src={FINISH_IMAGE}
                    alt="Finish"
                    className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] font-medium text-emerald-700"
                    fallback="FIN"
                  />
                ) : displayedLandmark ? (
                  <CardImage
                    src={LANDMARK_IMAGES[displayedLandmark.label]}
                    alt={`地标 ${displayedLandmark.label}`}
                    className="flex h-full w-full items-center justify-center text-center text-[10px] text-slate-600"
                    imageClassName="object-cover"
                    fallback={`地标:${displayedLandmark.owner === "red" ? "红" : "蓝"}-${displayedLandmark.label}`}
                  />
                ) : cell.hidden ? (
                  <CardImage
                    src={CARD_BACK_IMAGE}
                    alt="隐藏格"
                    className="flex h-full w-full items-center justify-center text-center text-[10px] text-slate-500"
                    imageClassName="object-cover"
                    fallback="—"
                  />
                ) : (
                  <div className="text-[10px] text-slate-500">—</div>
                )}
              </div>

              <div className="pointer-events-none absolute inset-x-1 bottom-1 space-y-1 text-[10px] text-slate-600">
                {displayedLandmark && (
                  <div className="truncate rounded bg-white/85 px-1 py-0.5 shadow-sm">
                    {displayedLandmark.owner === "red" ? "红" : "蓝"}-{displayedLandmark.label}
                  </div>
                )}
                {isHighlighted && <div className="rounded bg-white/85 px-1 py-0.5 text-sky-700 shadow-sm">可验证</div>}
                {isConnected && <div className="rounded bg-white/85 px-1 py-0.5 text-emerald-700 shadow-sm">已连通</div>}
                {isClaimSelected && <div className="rounded bg-white/85 px-1 py-0.5 text-amber-700 shadow-sm">验证选择</div>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
