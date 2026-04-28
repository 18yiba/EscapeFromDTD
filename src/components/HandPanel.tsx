/**
 * 手牌展示组件：只负责渲染与选择，不做规则判定。
 */

import { DTD_CARD_IMAGES, ROUTE_CARD_IMAGES } from "../constants";
import type { Card, Rotation } from "../types";
import { CardImage } from "./CardImage";

const DTD_CARD_LABELS = {
  "space-anxiety": "空间焦虑",
  "route-chaos": "路线混乱",
  "landmark-chaos": "地标混乱",
} as const;

export function HandPanel({
  cards,
  selectedCardId,
  selectedRotation,
  disabled = false,
  onSelect,
}: {
  cards: Card[];
  selectedCardId: string | null;
  selectedRotation: Rotation;
  disabled?: boolean;
  onSelect: (cardId: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 pb-1 sm:flex sm:gap-2 sm:overflow-x-auto">
      {cards.map((card) => {
        const selected = selectedCardId === card.id;
        const isDtd = card.kind === "dtd";
        const cardLabel = isDtd ? DTD_CARD_LABELS[card.type] : card.routeType;
        return (
          <button
            key={card.id}
            type="button"
            disabled={disabled}
            className={[
              "min-w-0 rounded-md border px-1.5 py-1 text-left text-[10px] sm:min-w-28 sm:rounded-lg sm:px-2 sm:py-2 sm:text-xs",
              selected ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50 hover:bg-slate-100",
              disabled ? "cursor-not-allowed opacity-50 hover:bg-slate-50" : "",
            ].join(" ")}
            onClick={() => onSelect(card.id)}
          >
            <div className="relative mx-auto aspect-square w-16 overflow-hidden rounded bg-white text-center text-[10px] sm:w-24 sm:rounded-md sm:text-xs">
              <CardImage
                src={isDtd ? DTD_CARD_IMAGES[card.type] : ROUTE_CARD_IMAGES[card.routeType]}
                alt={cardLabel}
                rotation={!isDtd && selected ? selectedRotation : 0}
                className={[
                  "absolute inset-0 flex items-center justify-center text-slate-700",
                  isDtd ? "scale-110 bg-orange-50" : "bg-white",
                ].join(" ")}
                imageClassName="object-contain"
                fallback={<div className="px-1 font-medium">{cardLabel}</div>}
              />
              {isDtd && (
                <div className="pointer-events-none absolute left-1 top-1 z-10 rounded bg-white/80 px-1.5 py-0.5 text-xs font-medium leading-none text-slate-800 shadow-sm">
                  {cardLabel}
                </div>
              )}
            </div>
          </button>
        );
      })}
      {cards.length === 0 && <div className="text-xs text-slate-500">（无手牌）</div>}
    </div>
  );
}
