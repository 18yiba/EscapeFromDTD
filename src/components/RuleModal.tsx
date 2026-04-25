/**
 * 规则说明弹窗：仅负责展示静态规则文案与关闭交互。
 * 不承载任何游戏规则逻辑，也不接入 store。
 */

import { Button } from "./Button";

type RuleModalProps = {
  onClose: () => void;
};

const RULES = [
  "两名玩家轮流行动",
  "每回合只能选择一个主行动：查看 1 张地标 或 使用 1 张手牌",
  "使用路线牌连接路径",
  "通过端口匹配形成有效连通",
  "连通达到阈值后不会自动获胜，必须主动宣布胜利",
  "宣布胜利时，只能从当前与 Finish 连通的路线网络中的牌位翻验 3 张牌",
  "若翻验的 3 张牌全部属于当前玩家，则宣告成功；否则直接宣告失败并进入结算",
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

        <ul className="space-y-2 pl-5 text-sm text-slate-700">
          {RULES.map((rule) => (
            <li key={rule} className="list-disc">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
