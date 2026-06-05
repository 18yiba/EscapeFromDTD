import { useState, type ButtonHTMLAttributes } from "react";
import { Button } from "../components/Button";
import type { CopiedLinkType, OnlinePlayerRole, OnlinePlayerSession, OnlineRoomState } from "../online/types";

type OnlineRoomOverlayProps = {
  room: OnlineRoomState;
  role: OnlinePlayerRole;
  copiedLink: CopiedLinkType;
  errorMessage: string | null;
  onCopy: (value: string) => void;
  onSetReady: (ready: boolean) => void;
  onStartTutorial: () => void;
  onConfirmTutorialReady: () => void;
};

const TUTORIAL_PAGES = [
  {
    title: "翻牌机制",
    imageText: "[ 此处放置原生的绘本风教学图 ]",
    description: "在位置地图上寻找己方阵营的地标卡牌，并记住所处位置。点击地图上未揭开的格子，某些下方可能是地标，也可能什么都没有。",
  },
  {
    title: "放置路线",
    imageText: "[ 此处放置路线放置教学图 ]",
    description: "选择手牌中的路线卡，旋转到合适方向后放置在地图上。路线会帮助你把地标与终点连接起来。",
  },
  {
    title: "胜利目标",
    imageText: "[ 此处放置胜利目标教学图 ]",
    description: "当你认为足够多的己方地标已经和终点连通时，可以发起胜利验证。验证成功即可逃出地图岛。",
  },
  {
    title: "DTD卡牌规则",
    imageText: "[ 此处放置 DTD 卡牌教学图 ]",
    description: "DTD 卡会制造空间干扰，例如跳过行动、旋转路线或交换隐藏内容。使用前请留意当前目标和时机。",
  },
];

export function OnlineRoomOverlay({
  room,
  role,
  copiedLink,
  errorMessage,
  onCopy,
  onSetReady,
  onStartTutorial,
  onConfirmTutorialReady,
}: OnlineRoomOverlayProps) {
  if (room.roomStatus === "playing") return null;

  const host = room.players.find((player) => player.role === "host");
  const guest = room.players.find((player) => player.role === "guest");
  const currentPlayer = room.players.find((player) => player.role === role);
  const bothReady = Boolean(host?.connected && host.ready && guest?.connected && guest.ready);
  const isTutorial = room.roomStatus === "tutorial";
  const identityLabel = role === "host" ? "你是红方" : "你是蓝方";

  if (isTutorial) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#172018]/55 px-3 py-4 backdrop-blur-[2px] sm:px-5">
        <TutorialPanel currentPlayer={currentPlayer} onConfirmTutorialReady={onConfirmTutorialReady} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#172018]/55 px-3 py-4 backdrop-blur-[2px] sm:px-5">
      <section className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#d8c8a9] bg-[#fffaf0] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-6">
        <header className="flex flex-col gap-3 border-b border-[#dccdb5] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-[#78976f]">ONLINE ROOM</p>
            <h1 className="mt-2 text-2xl font-black text-[#243126] sm:text-3xl">联机房间</h1>
          </div>
          <span className="w-fit rounded-full bg-[#e5eadb] px-4 py-2 text-sm font-black text-[#526f4d]">{identityLabel}</span>
        </header>

        <>
          <InfoPanel
            room={room}
            role={role}
            host={host}
            guest={guest}
            currentPlayer={currentPlayer}
            copiedLink={copiedLink}
            onCopy={onCopy}
            onSetReady={onSetReady}
          />

          <footer className="mt-5 border-t border-[#dccdb5] pt-4">
            {role === "host" ? (
              <Button
                className="w-full rounded-2xl bg-[#526f4d] py-3 text-base hover:bg-[#425d3e]"
                disabled={!bothReady}
                onClick={onStartTutorial}
              >
                开始游戏
              </Button>
            ) : (
              <div className="rounded-2xl border border-[#dccdb5] bg-white px-4 py-3 text-center text-sm font-bold text-[#6a604f]">
                等待房主开始游戏
              </div>
            )}
            {role === "host" ? (
              <p className="mt-3 text-center text-sm text-[#8a6b41]">
                {bothReady ? "全部玩家已准备，请开始游戏。" : "双方都准备后，房主才能开始游戏。"}
              </p>
            ) : (
              !bothReady && <p className="mt-3 text-center text-sm text-[#8a6b41]">双方都准备后，房主才能开始游戏。</p>
            )}
            {errorMessage && <p className="mt-3 text-center text-sm font-bold text-[#a9473b]">{errorMessage}</p>}
          </footer>
        </>
      </section>
    </div>
  );
}

function InfoPanel({
  room,
  role,
  host,
  guest,
  currentPlayer,
  copiedLink,
  onCopy,
  onSetReady,
}: {
  room: OnlineRoomState;
  role: OnlinePlayerRole;
  host?: OnlinePlayerSession;
  guest?: OnlinePlayerSession;
  currentPlayer?: OnlinePlayerSession;
  copiedLink: CopiedLinkType;
  onCopy: (value: string) => void;
  onSetReady: (ready: boolean) => void;
}) {
  const redStatus = host?.ready ? "已准备" : "未准备";
  const blueStatus = guest?.ready ? "已准备" : "未准备";
  const currentPlayerConnected = Boolean(currentPlayer?.connected);
  const currentPlayerReady = Boolean(currentPlayer?.ready);

  return (
    <div className="mt-5 rounded-3xl border border-[#dccdb5] bg-white p-4 shadow-[0_14px_34px_rgba(70,62,43,0.08)]">
      <div className="grid gap-3 text-sm">
        <InfoRow label="红方状态" value={redStatus} connected={Boolean(host?.connected)} />
        <InfoRow label="蓝方状态" value={blueStatus} connected={Boolean(guest?.connected)} />
        <RoomCodeRow roomId={room.roomId} copied={copiedLink === "inviteCode"} onCopy={onCopy} />
      </div>
      <p className="mt-3 px-3 text-xs font-medium leading-5 text-[#8c9b84]">
        把房间号发给朋友，对方在首页输入房间号即可加入。
      </p>
      <Button
        variant={currentPlayerReady ? "secondary" : "primary"}
        className={currentPlayerReady ? "mt-4 w-full rounded-2xl" : "mt-4 w-full rounded-2xl bg-[#526f4d] hover:bg-[#425d3e]"}
        disabled={!currentPlayerConnected}
        onClick={() => onSetReady(!currentPlayerReady)}
      >
        {currentPlayerReady ? "取消准备" : role === "host" ? "红方准备" : "蓝方准备"}
      </Button>
    </div>
  );
}

function InfoRow({ label, value, connected = false }: { label: string; value: string; connected?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f1e4] px-3 py-2">
      <span className="flex items-center gap-2 text-[#6a604f]">
        {label}
        {connected && <ConnectionDot />}
      </span>
      <span className="font-bold text-[#243126]">{value}</span>
    </div>
  );
}

function RoomCodeRow({
  roomId,
  copied,
  onCopy,
}: {
  roomId: string;
  copied: boolean;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f1e4] px-3 py-2">
      <span className="text-[#6a604f]">房间号</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-black tracking-[0.16em] text-[#243126]">{roomId}</span>
        <button
          type="button"
          className={[
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
            copied
              ? "border-[#78976f] bg-[#e5eadb] text-[#526f4d]"
              : "border-[#d8c8a9] bg-white text-[#52614d] hover:border-[#78976f] hover:text-[#243126]",
          ].join(" ")}
          aria-label={copied ? "房间号已复制" : "复制房间号"}
          title={copied ? "房间号已复制" : "复制房间号"}
          onClick={() => onCopy(roomId)}
        >
          <CopyIcon />
        </button>
      </div>
    </div>
  );
}

function ConnectionDot() {
  return <span className="h-2.5 w-2.5 rounded-full bg-[#58b368] shadow-[0_0_0_3px_rgba(88,179,104,0.18),0_0_12px_rgba(88,179,104,0.8)]" aria-label="已连接" />;
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TutorialPanel({
  currentPlayer,
  onConfirmTutorialReady,
}: {
  currentPlayer?: OnlinePlayerSession | null;
  onConfirmTutorialReady: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const currentPage = TUTORIAL_PAGES[pageIndex];
  const isLastPage = pageIndex === TUTORIAL_PAGES.length - 1;
  const hasConfirmed = Boolean(currentPlayer?.tutorialReady);

  return (
    <section className="max-h-[calc(100dvh-2rem)] w-full max-w-[530px] overflow-y-auto rounded-[22px] bg-white px-4 py-6 text-[#243126] shadow-[0_28px_90px_rgba(0,0,0,0.25)] sm:px-6">
      <h1 className="text-center text-2xl font-black text-[#4F6B4F] sm:text-3xl">逃出地图岛指南</h1>

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        {TUTORIAL_PAGES.map((page, index) => {
          const active = index === pageIndex;
          return (
            <button
              key={page.title}
              type="button"
              className={[
                "rounded-full border px-4 py-2 text-sm font-bold transition",
                active
                  ? "border-[#4F6B4F] bg-[#4F6B4F] text-white"
                  : "border-[#4F6B4F] bg-[#F8F9FA] text-[#4F6B4F] hover:bg-[#edf3ea]",
              ].join(" ")}
              onClick={() => setPageIndex(index)}
            >
              {page.title}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex aspect-[2/1] min-h-48 items-center justify-center rounded-2xl border border-[#ececec] bg-[#F8F9FA] px-4 text-center text-sm font-bold text-[#666666] sm:min-h-52">
        {currentPage.imageText}
      </div>

      <p className="mx-auto mt-5 max-w-md whitespace-pre-line text-center text-sm font-semibold leading-7 text-[#666666]">{currentPage.description}</p>

      {hasConfirmed ? (
        <TutorialActionButton className="mt-5 w-full" disabled>
          已确认，等待对方
        </TutorialActionButton>
      ) : isLastPage ? (
        <TutorialActionButton className="mt-5 w-full" onClick={onConfirmTutorialReady}>
          我已知晓，开始游戏
        </TutorialActionButton>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TutorialActionButton onClick={() => setPageIndex((index) => Math.min(index + 1, TUTORIAL_PAGES.length - 1))}>
            下一页
          </TutorialActionButton>
          <TutorialActionButton variant="secondary" onClick={onConfirmTutorialReady}>
            直接开始
          </TutorialActionButton>
        </div>
      )}
    </section>
  );
}

function TutorialActionButton({
  variant = "primary",
  className = "",
  children,
  style,
  ...props
}: {
  variant?: "primary" | "secondary";
  className?: string;
  children: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      {...props}
      className={[
        "inline-flex min-h-12 items-center justify-center rounded-xl border px-5 py-3 text-base font-black leading-5 transition",
        "disabled:cursor-not-allowed disabled:opacity-55",
        isPrimary ? "hover:brightness-95" : "hover:brightness-[0.98]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderColor: "#4F6B4F",
        backgroundColor: isPrimary ? "#4F6B4F" : "#F8F9FA",
        color: isPrimary ? "#FFFFFF" : "#4F6B4F",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
