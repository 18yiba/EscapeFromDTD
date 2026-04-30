/**
 * Landing page UI for v0.9.
 * This view only owns presentation, navigation, and entry interactions.
 */

import { useState } from "react";
import { RuleModal } from "../components/RuleModal";
import { APP_TITLE } from "../constants";
import type { GameMode } from "../types";

type LandingViewProps = {
  onEnter: (mode: GameMode) => void;
};

type NavItem =
  | { label: string; href: string; type: "anchor" }
  | { label: string; type: "rules" };

type FooterLink = {
  label: string;
  href: string;
};

const EXTERNAL_LINKS = {
  lab: "#", // TODO: Replace with Cognomics Lab homepage when available.
  privacy: "#", // TODO: Replace with privacy policy URL.
  about: "#", // TODO: Replace with about page URL.
  feedback: "#", // TODO: Replace with feedback form or email URL.
  github: "#", // TODO: Replace with repository URL when public.
} as const;

const LANDING_NAV_ITEMS: NavItem[] = [
  { label: "游戏背景", href: "#background", type: "anchor" },
  { label: "交互机制", href: "#mechanics", type: "anchor" },
  { label: "规则说明", type: "rules" },
];

const FOOTER_LINKS: FooterLink[] = [
  { label: "隐私政策", href: EXTERNAL_LINKS.privacy },
  { label: "关于我们", href: EXTERNAL_LINKS.about },
  { label: "联系反馈", href: EXTERNAL_LINKS.feedback },
  { label: "GitHub", href: EXTERNAL_LINKS.github },
];

const MECHANICS = [
  {
    icon: "01",
    title: "地标识别",
    description: "玩家需要探索地图格，记忆藏在迷雾下的地标位置，建立初步空间坐标。",
  },
  {
    icon: "02",
    title: "路径串联",
    description: "投放路径卡片，物理连接地标与终点，模拟大脑规划路线的过程。",
  },
  {
    icon: "03",
    title: "应对干扰",
    description: "使用功能牌触发位置混乱或旋转，练习面对认知偏差时重新定位。",
  },
];

const BACKGROUND_TILES: Array<{
  placeholderLabel: string;
  caption: string;
  icon: "map" | "alert";
}> = [
  { placeholderLabel: "地图底板 5x5", caption: "认知地图构建", icon: "map" },
  { placeholderLabel: "DTD 干扰牌", caption: "模拟认知失调", icon: "alert" },
];

const LANDING_ACTIONS: Array<{ label: string; mode: GameMode; tone: "primary" | "secondary" }> = [
  { label: "双人对战", mode: "hotseat", tone: "primary" },
  { label: "AI 对战", mode: "ai", tone: "secondary" },
];

export function LandingView({ onEnter }: LandingViewProps) {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openRules = () => {
    setIsRuleModalOpen(true);
    setIsMenuOpen(false);
  };

  const startMode = (mode: GameMode) => {
    setIsMenuOpen(false);
    onEnter(mode);
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f7f1e4] text-[#243126]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#d9cab1]/80 bg-[#fffaf0]/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="主导航">
          <a href="#top" className="group flex min-w-0 items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#6f8d68]">
            <CompassMark className="h-8 w-8 shrink-0 transition-transform group-hover:-rotate-6" />
            <span className="truncate text-sm font-semibold tracking-[0.08em] text-[#243126] sm:text-base">{APP_TITLE}</span>
          </a>

          <div className="hidden items-center gap-2 md:flex">
            {LANDING_NAV_ITEMS.map((item) =>
              item.type === "rules" ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={openRules}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#52614d] transition hover:bg-[#e9ddc6] hover:text-[#243126] active:scale-95"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#52614d] transition hover:bg-[#e9ddc6] hover:text-[#243126] active:scale-95"
                >
                  {item.label}
                </a>
              )
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d4c4a8] bg-[#fffaf0] text-[#243126] shadow-sm transition hover:scale-105 hover:shadow-md active:scale-95 md:hidden"
            aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {isMenuOpen && (
        <div className="fixed bottom-0 left-0 right-0 top-16 z-[999] overflow-y-auto border-t border-[#d9cab1] bg-[#F9F7F2] shadow-lg md:hidden">
          <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-between gap-8 px-6 py-8">
            <div className="flex flex-col gap-2">
              {LANDING_NAV_ITEMS.map((item) =>
                item.type === "rules" ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={openRules}
                    className="rounded-xl px-4 py-3 text-left text-base font-medium text-[#243126] transition hover:bg-[#e9ddc6] active:scale-[0.99]"
                  >
                    {item.label}
                  </button>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-[#243126] transition hover:bg-[#e9ddc6] active:scale-[0.99]"
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>
            <div className="grid gap-3 pt-3">
              {LANDING_ACTIONS.map((action) => (
                <LandingButton key={action.mode} tone={action.tone} onClick={() => startMode(action.mode)}>
                  {action.label}
                </LandingButton>
              ))}
            </div>
          </div>
        </div>
      )}

      <main id="top">
        <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden px-4 pb-14 pt-28 sm:px-6 sm:pb-18 sm:pt-32 lg:px-8">
          <MapTexture />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.75fr)]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d1bf9f] bg-[#fffaf0]/80 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[#607a5c] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#78976f]" />
                ESCAPE FROM DTD
              </div>
              <h1 className="text-5xl font-black leading-[1.02] tracking-normal text-[#243126] sm:text-6xl lg:text-7xl">{APP_TITLE}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5b6654] sm:text-xl">
                通过地标识别与路径构建，探索并克服发展性地形定向障碍。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {LANDING_ACTIONS.map((action) => (
                  <LandingButton key={action.mode} tone={action.tone} onClick={() => startMode(action.mode)}>
                    {action.label}
                  </LandingButton>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[420px]">
              <div className="rounded-[2rem] border-2 border-[#89a37e] bg-[#fffdf7] p-4 shadow-[0_24px_70px_rgba(70,62,43,0.16)] transition hover:rotate-1 hover:shadow-[0_28px_80px_rgba(70,62,43,0.2)]">
                <MapIslandIllustration />
              </div>
            </div>
          </div>
        </section>

        <section id="background" className="scroll-mt-24 border-y border-[#dccdb5] bg-[#fffaf0] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.75fr)] lg:items-center">
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-[#78976f]">GAME BACKGROUND</p>
              <h2 className="mt-3 text-3xl font-bold text-[#243126] sm:text-4xl">什么是 DTD？</h2>
              <div className="mt-6 space-y-4 text-base leading-8 text-[#5b6654]">
                <p>发展性地形定向障碍（DTD）是一种鲜为人知的认知障碍，它不是单纯的“路痴”。</p>
                <p>它更接近大脑在空间定位和地图构建能力上的先天发育迟缓，让熟悉路线也可能变得难以组织。</p>
                <p>《逃出地图岛》将识别地标、串联路径、构建地图转化为可视化博弈体验，让空间认知训练更容易被理解和讨论。</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {BACKGROUND_TILES.map((tile, index) => (
                <BackgroundTile key={tile.caption} tile={tile} className={index === 1 ? "lg:translate-y-8" : ""} />
              ))}
            </div>
          </div>
        </section>

        <section id="mechanics" className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-[0.18em] text-[#78976f]">HOW IT WORKS</p>
              <h2 className="mt-3 text-3xl font-bold text-[#243126] sm:text-4xl">游戏交互机制</h2>
              <p className="mt-4 text-base leading-8 text-[#5b6654]">三位一体的认知训练流程。</p>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              {MECHANICS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[#dccdb5] bg-[#fffdf7] p-6 shadow-[0_12px_36px_rgba(70,62,43,0.08)] transition hover:scale-[1.015] hover:shadow-[0_18px_48px_rgba(70,62,43,0.13)]"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#e5eadb] text-sm font-black text-[#607a5c]">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#243126]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5b6654]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dccdb5] bg-[#efe3cc] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <a href={EXTERNAL_LINKS.lab} className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#6f8d68]">
            <CompassMark className="h-9 w-9 shrink-0" />
            <div>
              <div className="text-sm font-black tracking-[0.18em] text-[#243126]">MAP ISLAND</div>
              <div className="mt-1 text-sm text-[#6a604f]">© Cognomics Lab @ ZJU</div>
            </div>
          </a>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#5b6654]">
            {FOOTER_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="transition hover:text-[#243126] hover:underline">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {isRuleModalOpen && <RuleModal onClose={() => setIsRuleModalOpen(false)} />}
    </div>
  );
}

function LandingButton({ tone, onClick, children }: { tone: "primary" | "secondary"; onClick: () => void; children: string }) {
  const toneClass =
    tone === "primary"
      ? "border-[#526f4d] bg-[#526f4d] text-[#fffaf0] shadow-[0_12px_26px_rgba(82,111,77,0.26)] hover:bg-[#425d3e]"
      : "border-[#cbb893] bg-[#fffaf0] text-[#243126] shadow-[0_10px_24px_rgba(70,62,43,0.1)] hover:bg-[#f0e4cf]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center rounded-full border px-7 py-3 text-base font-bold transition hover:scale-[1.025] hover:shadow-lg active:scale-95 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function BackgroundTile({ tile, className }: { tile: (typeof BACKGROUND_TILES)[number]; className?: string }) {
  const Icon = tile.icon === "map" ? MapPlaceholderIcon : AlertPlaceholderIcon;

  return (
    <article
      className={[
        "space-y-3 rounded-2xl bg-[#f7f1e4] p-4 shadow-[0_12px_32px_rgba(70,62,43,0.1)] transition hover:scale-[1.01] hover:shadow-[0_16px_42px_rgba(70,62,43,0.14)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#78976f] bg-[#fffdf7] text-[#c2c4bd]">
        <Icon className="h-9 w-9" />
        <span className="mt-2 text-[10px] font-medium text-[#b3b5ae]">{tile.placeholderLabel}</span>
      </div>
      <p className="text-center text-xs font-bold text-[#243126]">{tile.caption}</p>
    </article>
  );
}

function CompassMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <circle cx="24" cy="24" r="21" fill="#fffaf0" stroke="#78976f" strokeWidth="3" />
      <path d="M29.5 10.5 25.7 25.7 10.5 29.5 22.3 22.3 29.5 10.5Z" fill="#78976f" />
      <path d="M18.5 37.5 22.3 22.3 37.5 18.5 25.7 25.7 18.5 37.5Z" fill="#c88f5a" />
      <circle cx="24" cy="24" r="3" fill="#243126" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function MapPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2V6Z" />
      <path d="M8 4v13" />
      <path d="M16 7v13" />
    </svg>
  );
}

function AlertPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M12 3 4.5 6.2v5.7c0 4.2 3 7.7 7.5 9.1 4.5-1.4 7.5-4.9 7.5-9.1V6.2L12 3Z" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function MapTexture() {
  return (
    <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70" aria-hidden="true">
      <defs>
        <pattern id="paper-grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M72 0H0v72" fill="none" stroke="#dccdb5" strokeWidth="1" opacity="0.36" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#paper-grid)" />
      <path d="M-80 520C160 360 240 640 520 460S880 220 1180 360" fill="none" stroke="#d0b98f" strokeWidth="2" strokeDasharray="8 12" opacity="0.45" />
      <circle cx="82%" cy="28%" r="180" fill="#e5eadb" opacity="0.45" />
    </svg>
  );
}

function MapIslandIllustration() {
  return (
    <svg viewBox="0 0 420 420" className="aspect-square w-full" role="img" aria-label="纸质地图岛插画">
      <rect x="0" y="0" width="420" height="420" rx="24" fill="#fffaf0" />
      <path d="M62 312C112 228 164 270 202 198C242 121 330 132 358 73" fill="none" stroke="#d7c7ab" strokeWidth="14" strokeLinecap="round" opacity="0.55" />
      <g transform="translate(88 76)">
        {Array.from({ length: 25 }).map((_, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          const isPath = [2, 7, 12, 13, 18, 23].includes(index);
          const isLandmark = [4, 10, 16].includes(index);
          return (
            <rect
              key={index}
              x={col * 50}
              y={row * 50}
              width="42"
              height="42"
              rx="10"
              fill={isPath ? "#dfe8d4" : isLandmark ? "#f1d7b5" : "#f8efd9"}
              stroke="#c9b896"
              strokeWidth="2"
            />
          );
        })}
      </g>
      <path d="M152 108h50v50h50v50h50" fill="none" stroke="#607a5c" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="106" cy="298" r="18" fill="#c88f5a" />
      <path d="M302 82 314 114 346 126 314 138 302 170 290 138 258 126 290 114 302 82Z" fill="#78976f" opacity="0.9" />
      <text x="210" y="356" textAnchor="middle" fill="#6a604f" fontSize="18" fontWeight="700" letterSpacing="3">
        DTD MAP
      </text>
    </svg>
  );
}
