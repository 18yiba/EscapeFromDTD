/**
 * layout/
 * 页面布局容器：标题栏、内容区、底部操作区等“结构性组件”。
 * 与 components/ 的区别：layout 更偏页面骨架、排版与区域划分。
 */

import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { Button } from "../components/Button";
import { RuleModal } from "../components/RuleModal";
import { APP_TITLE } from "../constants";

type AppLayoutProps = PropsWithChildren<{
  headerActions?: ReactNode;
}>;

export function AppLayout({ children, headerActions }: AppLayoutProps) {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="text-sm font-semibold">{APP_TITLE}</div>
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setIsRuleModalOpen(true)}>
              规则
            </Button>
          </div>
          <div className="flex items-center justify-end">{headerActions}</div>
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-screen-sm flex-1 px-4 py-4">{children}</main>
      {isRuleModalOpen && <RuleModal onClose={() => setIsRuleModalOpen(false)} />}
    </div>
  );
}
