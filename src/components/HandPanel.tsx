/**
 * 手牌展示组件：只负责渲染与选择，不做规则判定。
 */

import { ROUTE_CARD_IMAGES } from "../constants";
import type { Card, Rotation } from "../types";
import { CardImage } from "./CardImage";

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
            <div className="mb-0.5 text-[9px] uppercase text-slate-500 sm:mb-1 sm:text-[10px]">路线</div>
            <CardImage
              src={ROUTE_CARD_IMAGES[card.routeType]}
              alt={`路线牌 ${card.routeType}`}
              rotation={selected ? selectedRotation : 0}
              className="mx-auto flex aspect-[3/4] h-16 items-center justify-center overflow-hidden rounded bg-white p-0.5 text-center text-[10px] text-slate-700 sm:h-auto sm:w-24 sm:rounded-md sm:p-1 sm:text-xs"
              fallback={
                <div>
                  <div className="text-[10px] uppercase text-slate-500">路线</div>
                  <div className="font-medium">{card.routeType}</div>
                </div>
              }
            />
          </button>
        );
      })}
      {cards.length === 0 && <div className="text-xs text-slate-500">（无手牌）</div>}
    </div>
  );
}
