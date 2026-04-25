/**
 * 手牌展示组件：只负责渲染与选择，不做规则判定。
 */

import type { Card } from "../types";

export function HandPanel({
  cards,
  selectedCardId,
  disabled = false,
  onSelect,
}: {
  cards: Card[];
  selectedCardId: string | null;
  disabled?: boolean;
  onSelect: (cardId: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {cards.map((card) => {
        const selected = selectedCardId === card.id;
        return (
          <button
            key={card.id}
            type="button"
            disabled={disabled}
            className={[
              "min-w-28 rounded-lg border px-3 py-2 text-left text-xs",
              selected ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50 hover:bg-slate-100",
              disabled ? "cursor-not-allowed opacity-50 hover:bg-slate-50" : "",
            ].join(" ")}
            onClick={() => onSelect(card.id)}
          >
            <div className="text-[10px] uppercase text-slate-500">路线</div>
            <div className="font-medium">{card.routeType}</div>
          </button>
        );
      })}
      {cards.length === 0 && <div className="text-xs text-slate-500">（无手牌）</div>}
    </div>
  );
}
