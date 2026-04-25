/**
 * 重开确认弹窗：仅负责展示确认文案与按钮回调。
 * 不承载任何游戏规则或状态逻辑。
 */

import { Button } from "./Button";
import { createPortal } from "react-dom";

type RestartConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function RestartConfirmModal({ onCancel, onConfirm }: RestartConfirmModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restart-confirm-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="space-y-2">
          <h2 id="restart-confirm-title" className="text-base font-semibold text-slate-900">
            确认重来一局？
          </h2>
          <p className="text-sm text-slate-600">当前对局进度将被清空，是否重新开始？</p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={onConfirm}>确认重开</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
