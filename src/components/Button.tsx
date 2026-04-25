/**
 * components/
 * 可复用 UI 组件。这里不放任何游戏规则逻辑，只做展示与通用交互。
 */

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
  }
>;

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  const base =
    "inline-flex min-h-[2.5rem] items-center justify-center rounded-md px-4 py-2 text-sm font-medium leading-5 whitespace-nowrap transition " +
    "disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "bg-slate-100 text-slate-900 hover:bg-slate-200";

  return (
    <button {...props} className={[base, styles, className].filter(Boolean).join(" ")}>
      {children}
    </button>
  );
}
