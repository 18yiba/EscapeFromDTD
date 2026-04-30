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
  variant?: "game" | "landing";
}>;

export function AppLayout({ children, headerActions, variant = "game" }: AppLayoutProps) {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  if (variant === "landing") {
    return <div className="min-h-dvh bg-[#f7f1e4] text-[#243126]">{children}</div>;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white text-slate-900 lg:bg-[linear-gradient(180deg,#f7f3eb_0%,#efe8dc_100%)]">
      <header className="shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur lg:border-[#e2d6c6] lg:bg-[#fffaf3]/90">
        <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between gap-3 px-4 lg:h-[60px] lg:max-w-none lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden text-sm font-semibold text-slate-900 lg:block">{APP_TITLE}</div>
            <div className="text-sm font-semibold lg:hidden">{APP_TITLE}</div>
            <Button variant="secondary" className="px-3 py-1.5 text-xs lg:hidden" onClick={() => setIsRuleModalOpen(true)}>
              规则
            </Button>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end lg:justify-between lg:gap-4">
            {headerActions}
            <Button
              variant="secondary"
              className="hidden px-3 py-1.5 text-xs lg:inline-flex"
              onClick={() => setIsRuleModalOpen(true)}
            >
              规则
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-screen-sm flex-1 px-4 py-4 lg:max-w-none lg:px-6 lg:py-5">{children}</main>
      {isRuleModalOpen && <RuleModal onClose={() => setIsRuleModalOpen(false)} />}
    </div>
  );
}
