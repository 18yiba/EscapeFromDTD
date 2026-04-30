/**
 * 规则说明弹窗：仅负责展示静态规则文案与关闭交互。
 * 不承载任何游戏规则逻辑，也不接入 store。
 */

import { Button } from "./Button";

type RuleModalProps = {
  onClose: () => void;
};

const RULE_SECTIONS = [
  {
    title: "基本规则",
    items: [
      "两名玩家轮流行动",
      "游戏开始时，每名玩家有三张随机手牌（路线或者功能牌），4×4 棋盘内为随机隐藏地标",
      "玩家每回合只能选择一种行动：查看 1 张任意地标或使用 1 张任意手牌",
      "除地标牌外，棋盘内还分布有空白占位牌",
    ],
  },
  {
    title: "胜利条件",
    items: [
      "在地标上放置路线牌，连成路径达到终点",
      "路径必须穿过 3 张己方地标，且与右上角终点连通，当完成连通时，可以宣布胜利",
      "宣布胜利后，玩家需要进行地标验证，从路径中选出 3 张己方地标",
      "若查验正确，则游戏胜利；否则游戏失败，对手胜利",
    ],
  },
  {
    title: "DTD 牌效果",
    items: [
      "空间焦虑牌：指定玩家无法进行下一个行动",
      "地标混乱牌：任选棋盘内对调两个地标牌",
      "路线混乱牌：任选一行/一列路线顺时针旋转 90°",
    ],
  },
];

export function RuleModal({ onClose }: RuleModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rule-modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="rule-modal-title" className="text-base font-semibold text-slate-900">
            游戏规则
          </h2>
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="max-h-[min(72vh,32rem)] space-y-4 overflow-y-auto pr-1">
          {RULE_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
              <ul className="mt-2 space-y-2 pl-5 text-sm leading-6 text-slate-700">
                {section.items.map((rule) => (
                  <li key={rule} className="list-disc">
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
