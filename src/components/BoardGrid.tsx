/**
 * Board 渲染组件（只展示，不做规则判定）。
 */

import { CARD_BACK_IMAGE, FINISH_IMAGE, LANDMARK_IMAGES, ROUTE_CARD_IMAGES } from "../constants";
import { getRouteOpenings } from "../utils";
import type { BoardState, Direction, RoutePlacement, WinClaimValidationMark } from "../types";
import { CardImage } from "./CardImage";

type TemporaryInspectedLandmark = {
  owner: "red" | "blue";
  label: string;
};

type RouteChaosTarget = { axis: "row" | "col"; index: number };

export function BoardGrid({
  board,
  selectedCellId,
  temporaryInspectedLandmarks,
  temporaryInspectedBlankCellIds = [],
  displayMode = "inGame",
  highlightedCellIds = [],
  connectedCellIds = [],
  claimSelectedCellIds = [],
  claimValidationResult,
  landmarkChaosSelectedCellIds = [],
  showAllHiddenContent = false,
  useRouteOverlay = false,
  showRouteChaosSelectors = false,
  routeChaosTarget = null,
  onSelectCell,
  onSelectRouteChaosTarget,
}: {
  board: BoardState;
  selectedCellId: number | null;
  temporaryInspectedLandmarks: Record<number, TemporaryInspectedLandmark>;
  temporaryInspectedBlankCellIds?: number[];
  displayMode?: "inGame" | "review";
  highlightedCellIds?: number[];
  connectedCellIds?: number[];
  claimSelectedCellIds?: number[];
  claimValidationResult?: Record<number, WinClaimValidationMark>;
  landmarkChaosSelectedCellIds?: number[];
  showAllHiddenContent?: boolean;
  useRouteOverlay?: boolean;
  showRouteChaosSelectors?: boolean;
  routeChaosTarget?: RouteChaosTarget | null;
  onSelectCell: (cellId: number) => void;
  onSelectRouteChaosTarget?: (target: RouteChaosTarget) => void;
}) {
  const grid = (
    <div
      className="grid aspect-square w-full max-w-full grid-rows-4 gap-1.5 sm:gap-2"
      style={{
        gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${board.rows}, minmax(0, 1fr))`,
      }}
    >
      {board.cells.map((cell) => {
        const isSelected = selectedCellId === cell.id;
        const temporaryInspectedLandmark = temporaryInspectedLandmarks[cell.id];
        const isTemporaryInspectedBlank = temporaryInspectedBlankCellIds.includes(cell.id);
        const isHighlighted = highlightedCellIds.includes(cell.id);
        const isConnected = connectedCellIds.includes(cell.id);
        const isClaimSelected = claimSelectedCellIds.includes(cell.id);
        const claimValidationMark = claimValidationResult?.[cell.id];
        const isClaimReviewing = Boolean(claimValidationResult) || displayMode === "review";
        const showClaimSelectionLabel = isClaimSelected && !isClaimReviewing;
        const isLandmarkChaosSelected = landmarkChaosSelectedCellIds.includes(cell.id);
        const visibleLandmark =
          (showAllHiddenContent || displayMode === "review") && cell.hidden?.kind === "landmark"
            ? { owner: cell.hidden.owner, label: cell.hidden.label }
            : cell.revealed.kind === "landmark"
            ? { owner: cell.revealed.owner, label: cell.revealed.label }
            : null;
        const visibleBlank =
          isTemporaryInspectedBlank || ((showAllHiddenContent || displayMode === "review") && cell.hidden?.kind === "blank");
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
              showClaimSelectionLabel ? "ring-2 ring-amber-500 ring-offset-2" : "",
              isLandmarkChaosSelected ? "z-10 scale-[1.03] ring-4 ring-yellow-400 ring-offset-2" : "",
              isHighlighted && !displayedLandmark ? "border-emerald-600" : "",
            ].join(" ")}
          >
            <div className="relative h-full w-full overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-white/70">
                {cell.route && !useRouteOverlay ? (
                  <CardImage
                    src={ROUTE_CARD_IMAGES[cell.route.routeType]}
                    alt={`路线牌 ${cell.route.routeType}`}
                    rotation={cell.route.rotation}
                    className="flex h-full w-full items-center justify-center text-center text-[10px] text-slate-600"
                    imageClassName="object-cover"
                    fallback={`路线:${cell.route.routeType} r${cell.route.rotation}`}
                  />
                ) : cell.kind === "finish" ? (
                  <CardImage
                    src={FINISH_IMAGE}
                    alt="Finish"
                    className="flex h-full w-full items-center justify-center text-center text-[10px] font-medium text-emerald-700"
                    imageClassName="object-cover"
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
                ) : visibleBlank ? (
                  <CardImage
                    src={CARD_BACK_IMAGE}
                    alt="空白格"
                    className="flex h-full w-full items-center justify-center text-center text-[10px] text-slate-500"
                    imageClassName="object-cover"
                    fallback="空白"
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
              <div className="pointer-events-none absolute inset-x-1 bottom-1 z-10 space-y-1 text-[10px] text-slate-600">
                {displayedLandmark && (
                  <div className="truncate rounded bg-white/85 px-1 py-0.5 shadow-sm">
                    {displayedLandmark.owner === "red" ? "红" : "蓝"}-{displayedLandmark.label}
                  </div>
                )}
                {visibleBlank && <div className="truncate rounded bg-white/85 px-1 py-0.5 shadow-sm">空白</div>}
              </div>
              {useRouteOverlay && cell.kind !== "finish" && cell.route && <RouteLineOverlay route={cell.route} />}
              {claimValidationMark && <ClaimValidationBadge mark={claimValidationMark} />}

              <div className="pointer-events-none absolute inset-x-1 bottom-1 z-30 space-y-1 text-[10px] text-slate-600">
                {!useRouteOverlay && isHighlighted && (
                  <div className="rounded bg-white/85 px-1 py-0.5 text-sky-700 shadow-sm">可验证</div>
                )}
                {!useRouteOverlay && isConnected && (
                  <div className="rounded bg-white/85 px-1 py-0.5 text-emerald-700 shadow-sm">已连通</div>
                )}
                {showClaimSelectionLabel && <div className="rounded bg-amber-100/95 px-1 py-0.5 font-medium text-amber-800 shadow-sm">验证选择</div>}
                {isLandmarkChaosSelected && <div className="rounded bg-yellow-100/90 px-1 py-0.5 text-yellow-800 shadow-sm">DTD选择</div>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  if (!showRouteChaosSelectors) {
    return grid;
  }

  return (
    <div className="grid w-full max-w-full grid-cols-[1.5rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_1.5rem] gap-1.5 sm:grid-cols-[2rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)_2rem] sm:gap-2">
      <div
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateRows: `repeat(${board.rows}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: board.rows }, (_, row) => {
          const selected = routeChaosTarget?.axis === "row" && routeChaosTarget.index === row;
          return (
            <button
              key={`row-${row}`}
              type="button"
              className={[
                "rounded border text-[10px] font-medium transition",
                selected ? "border-orange-500 bg-orange-100 text-orange-900" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100",
              ].join(" ")}
              onClick={() => onSelectRouteChaosTarget?.({ axis: "row", index: row })}
            >
              行{row + 1}
            </button>
          );
        })}
      </div>

      <div>{grid}</div>
      <div />
      <div
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: board.cols }, (_, col) => {
          const selected = routeChaosTarget?.axis === "col" && routeChaosTarget.index === col;
          return (
            <button
              key={`col-${col}`}
              type="button"
              className={[
                "rounded border text-[10px] font-medium transition",
                selected ? "border-orange-500 bg-orange-100 text-orange-900" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100",
              ].join(" ")}
              onClick={() => onSelectRouteChaosTarget?.({ axis: "col", index: col })}
            >
              列{col + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClaimValidationBadge({ mark }: { mark: WinClaimValidationMark }) {
  const isCorrect = mark === "correct";
  return (
    <div
      className={[
        "pointer-events-none absolute right-1 top-1 z-50 flex h-5 w-5 items-center justify-center rounded-full text-sm text-white shadow ring-1 ring-white/70",
        isCorrect ? "bg-green-500/80" : "bg-red-500/80",
      ].join(" ")}
      aria-label={isCorrect ? "验证正确" : "验证错误"}
    >
      {isCorrect ? "✅" : "❌"}
    </div>
  );
}

function RouteLineOverlay({ route }: { route: RoutePlacement }) {
  const openings = getRouteOpenings(route.routeType, route.rotation);
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full drop-shadow-[0_1px_2px_rgba(124,63,16,0.28)]"
      viewBox="-2 -2 104 104"
      preserveAspectRatio="none"
    >
      {openings.map((direction) => {
        const end = getOverlayEndPoint(direction);
        return (
          <g key={direction}>
            <line
              x1="50"
              y1="50"
              x2={end.x}
              y2={end.y}
              stroke="#7c3f10"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.72"
            />
            <line
              x1="50"
              y1="50"
              x2={end.x}
              y2={end.y}
              stroke="#F59E0B"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </g>
        );
      })}
    </svg>
  );
}

function getOverlayEndPoint(direction: Direction): { x: number; y: number } {
  if (direction === "up") return { x: 50, y: -2 };
  if (direction === "right") return { x: 102, y: 50 };
  if (direction === "down") return { x: 50, y: 102 };
  return { x: -2, y: 50 };
}
