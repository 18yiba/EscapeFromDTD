/**
 * 联系弹窗：仅承载联系方式展示、复制与关闭交互。
 * 不接入 store，也不包含任何游戏规则逻辑。
 */

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "./Button";

type ContactModalProps = {
  onClose: () => void;
};

type CopyKey = "researchEmail" | "researchEmail2" | "gameEmail" | "gamexhs";

const contactLinks = {
  researchEmail: "aohan_xu@zju.edu.cn",
  researchEmail2: "duxiaoguo@zju.edu.cn",
  gameEmail: "haorana710@zju.edu.cn",
  gamexhs: "955392308",
  wechatLink: "#",
};

const copyLabels: Record<CopyKey, string> = {
  researchEmail: "研究邮箱",
  researchEmail2: "研究邮箱",
  gameEmail: "游戏邮箱",
  gamexhs: "小红书账号",
};

export function ContactModal({ onClose }: ContactModalProps) {
  const [copiedKey, setCopiedKey] = useState<CopyKey | null>(null);

  const copyValue = async (key: CopyKey) => {
    const value = contactLinks[key];

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        copyWithTextarea(value);
      }
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
    } catch {
      copyWithTextarea(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="max-h-[min(86vh,46rem)] w-full max-w-2xl overflow-hidden rounded-3xl bg-[#fffaf0] shadow-[0_28px_90px_rgba(36,49,38,0.28)] animate-[contact-modal-in_160ms_ease-out]">
        <div className="flex items-center justify-between gap-4 border-b border-[#e2d6c6] px-5 py-4 sm:px-6">
          <div>
            <h2 id="contact-modal-title" className="text-lg font-bold text-[#243126]">
              联系我们
            </h2>
            <p className="mt-1 text-sm text-[#6a604f]">研究咨询、规则反馈与课题组动态入口。</p>
          </div>
          <Button variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="max-h-[calc(min(86vh,46rem)-5.5rem)] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <ContactSection
            tone="research"
            icon={<ResearchIcon className="h-6 w-6" />}
            title="心理学实验与空间导航"
            subtitle="了解 DTD 与空间导航相关的心理学研究"
            rows={[
              { label: copyLabels.researchEmail, value: contactLinks.researchEmail, copyKey: "researchEmail" },
              { label: copyLabels.researchEmail2, value: contactLinks.researchEmail2, copyKey: "researchEmail2" },
            ]}
            copiedKey={copiedKey}
            onCopy={copyValue}
          />

          <ContactSection
            tone="game"
            icon={<GameIcon className="h-6 w-6" />}
            title="游戏设定与规则咨询"
            subtitle="反馈游戏逻辑、规则问题或玩法建议"
            rows={[
              { label: copyLabels.gameEmail, value: contactLinks.gameEmail, copyKey: "gameEmail" },
              { label: copyLabels.gamexhs, value: contactLinks.gamexhs, copyKey: "gamexhs" },
            ]}
            copiedKey={copiedKey}
            onCopy={copyValue}
          />

          <section className="rounded-2xl border border-[#e2d6c6] bg-[#f7f1e4] p-4 shadow-[0_12px_32px_rgba(70,62,43,0.08)] sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fffaf0] text-[#78976f] shadow-sm">
                    <WechatIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#243126]">关注课题组公众号</h3>
                    <p className="mt-1 text-sm leading-6 text-[#6a604f]">获取最新研究进展与游戏活动</p>
                  </div>
                </div>
                <a
                  href={contactLinks.wechatLink}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[#cbb893] bg-[#fffaf0] px-4 py-2 text-sm font-semibold text-[#243126] transition hover:bg-[#efe3cc] active:scale-95"
                >
                  前往公众号
                </a>
              </div>
              <div className="flex h-32 w-32 shrink-0 items-center justify-center self-center overflow-hidden rounded-2xl border border-[#e2d6c6] bg-white p-2 shadow-sm">
                <img src="/qrcode/lab-wechat.png" alt="课题组公众号二维码" className="h-full w-full object-contain" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ContactSection({
  tone,
  icon,
  title,
  subtitle,
  rows,
  copiedKey,
  onCopy,
}: {
  tone: "research" | "game";
  icon: ReactNode;
  title: string;
  subtitle: string;
  rows: Array<{ label: string; value: string; copyKey: CopyKey }>;
  copiedKey: CopyKey | null;
  onCopy: (key: CopyKey) => void;
}) {
  const toneClass =
    tone === "research"
      ? "border-[#b9d6cf] bg-[#eef8f4] text-[#315f59]"
      : "border-[#c9ddb9] bg-[#f0f7e8] text-[#526f4d]";

  return (
    <section className={`rounded-2xl border p-4 shadow-[0_12px_32px_rgba(70,62,43,0.08)] sm:p-5 ${toneClass}`}>
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#243126]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#5b6654]">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div key={row.copyKey} className="flex items-center gap-2 rounded-xl bg-white/75 px-3 py-2 text-sm text-[#243126] shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-[#6a604f]">{row.label}</div>
              <div className="truncate font-medium">{row.value}</div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9cab1] bg-[#fffaf0] text-[#52614d] transition hover:scale-105 hover:shadow-sm active:scale-95"
              aria-label={`复制${row.label}`}
              onClick={() => onCopy(row.copyKey)}
            >
              {copiedKey === row.copyKey ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function copyWithTextarea(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function ResearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M9 3h6" />
      <path d="M10 3v5l-5.5 9.5A2.3 2.3 0 0 0 6.5 21h11a2.3 2.3 0 0 0 2-3.5L14 8V3" />
      <path d="M8 15h8" />
    </svg>
  );
}

function GameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <path d="M8 12h4" />
      <path d="M10 10v4" />
      <path d="M16.5 11.5h.01" />
      <path d="M18.5 14h.01" />
    </svg>
  );
}

function WechatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M10.5 17.5a7 7 0 1 1 6.7-9" />
      <path d="M13.5 12.5a5.2 4.5 0 1 0 5.8 6.9L22 20l-.8-2.1a4.3 4.3 0 0 0 .3-1.6 5.2 4.5 0 0 0-8-3.8Z" />
      <path d="M8.5 10h.01" />
      <path d="M13.5 10h.01" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
