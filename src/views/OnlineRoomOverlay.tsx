import { Button } from "../components/Button";
import type { CopiedLinkType, OnlinePlayerRole, OnlinePlayerSession, OnlineRoomState } from "../online/types";

type OnlineRoomOverlayProps = {
  room: OnlineRoomState;
  role: OnlinePlayerRole;
  inviteUrl: string;
  hostRecoveryUrl: string | null;
  copiedLink: CopiedLinkType;
  errorMessage: string | null;
  onCopy: (linkType: Exclude<CopiedLinkType, null>, value: string) => void;
  onSetReady: (ready: boolean) => void;
  onStartTutorial: () => void;
  onConfirmTutorialReady: () => void;
};

const TUTORIAL_ITEMS = [
  "观察隐藏地标，记住关键位置。",
  "选择路线牌并旋转，把地标和终点连成网络。",
  "DTD 卡会制造干扰，本阶段先按现有规则理解即可。",
];

export function OnlineRoomOverlay({
  room,
  role,
  inviteUrl,
  hostRecoveryUrl,
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
  const statusLabel = isTutorial ? "新手教程" : "等待准备";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#172018]/55 px-3 py-4 backdrop-blur-[2px] sm:px-5">
      <section className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#d8c8a9] bg-[#fffaf0] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-6">
        <header className="flex flex-col gap-3 border-b border-[#dccdb5] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-[#78976f]">ONLINE ROOM</p>
            <h1 className="mt-2 text-2xl font-black text-[#243126] sm:text-3xl">联机房间</h1>
          </div>
          <span className="w-fit rounded-full bg-[#e5eadb] px-4 py-2 text-sm font-black text-[#526f4d]">{statusLabel}</span>
        </header>

        {isTutorial ? (
          <TutorialPanel currentPlayer={currentPlayer} onConfirmTutorialReady={onConfirmTutorialReady} />
        ) : (
          <>
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
              <InfoPanel room={room} inviteUrl={inviteUrl} hostRecoveryUrl={hostRecoveryUrl} copiedLink={copiedLink} onCopy={onCopy} />
              <div className="grid gap-3">
                <PlayerCard label="Host" player={host} active={role === "host"} onSetReady={role === "host" ? onSetReady : undefined} />
                <PlayerCard label="Guest" player={guest} active={role === "guest"} onSetReady={role === "guest" ? onSetReady : undefined} />
              </div>
            </div>

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
              {!bothReady && <p className="mt-3 text-center text-sm text-[#8a6b41]">Host 和 Guest 都准备后，房主才能开始游戏。</p>}
              {errorMessage && <p className="mt-3 text-center text-sm font-bold text-[#a9473b]">{errorMessage}</p>}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function InfoPanel({
  room,
  inviteUrl,
  hostRecoveryUrl,
  copiedLink,
  onCopy,
}: {
  room: OnlineRoomState;
  inviteUrl: string;
  hostRecoveryUrl: string | null;
  copiedLink: CopiedLinkType;
  onCopy: (linkType: Exclude<CopiedLinkType, null>, value: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-[#dccdb5] bg-white p-4 shadow-[0_14px_34px_rgba(70,62,43,0.08)]">
      <div className="grid gap-3 text-sm">
        <InfoRow label="房间状态" value="匿名联机" />
        <InfoRow label="当前阶段" value={room.roomStatus === "waiting" ? "等待准备" : room.roomStatus} />
        <InfoRow label="邀请码" value={room.roomId} strong />
      </div>
      <div className="mt-4 grid gap-3">
        <Button variant="secondary" className="rounded-2xl" onClick={() => onCopy("inviteCode", room.roomId)}>
          {copiedLink === "inviteCode" ? "邀请码已复制" : "复制邀请码"}
        </Button>
        <Button variant="primary" className="rounded-2xl bg-[#526f4d] hover:bg-[#425d3e]" onClick={() => onCopy("invite", inviteUrl)}>
          {copiedLink === "invite" ? "邀请链接已复制" : "复制邀请链接"}
        </Button>
      </div>
      <p className="mt-4 break-all rounded-2xl bg-[#f7f1e4] px-3 py-2 text-xs font-medium leading-5 text-[#52614d]">{inviteUrl}</p>
      {hostRecoveryUrl && (
        <button
          type="button"
          className="mt-3 text-left text-xs font-semibold leading-5 text-[#6a604f] underline-offset-4 hover:text-[#243126] hover:underline"
          onClick={() => onCopy("hostRecovery", hostRecoveryUrl)}
        >
          {copiedLink === "hostRecovery" ? "房主恢复链接已复制" : "复制房主恢复链接"}
        </button>
      )}
    </div>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f1e4] px-3 py-2">
      <span className="text-[#6a604f]">{label}</span>
      <span className={strong ? "font-black tracking-[0.16em] text-[#243126]" : "font-bold text-[#243126]"}>{value}</span>
    </div>
  );
}

function PlayerCard({
  label,
  player,
  active,
  onSetReady,
}: {
  label: string;
  player?: OnlinePlayerSession;
  active: boolean;
  onSetReady?: (ready: boolean) => void;
}) {
  const connected = Boolean(player?.connected);
  const ready = Boolean(player?.ready);
  return (
    <article className="rounded-3xl border border-[#dccdb5] bg-white p-4 shadow-[0_12px_30px_rgba(70,62,43,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#243126]">{label}</h2>
          <p className="mt-1 text-xs text-[#6a604f]">{player?.displayName ?? "等待加入"}</p>
        </div>
        {active && <span className="rounded-full bg-[#e5eadb] px-3 py-1 text-xs font-black text-[#526f4d]">当前端</span>}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-bold">
        <StatusPill active={connected} activeText="已连接" inactiveText="未连接" />
        <StatusPill active={ready} activeText="已准备" inactiveText="未准备" />
      </div>
      {onSetReady && (
        <Button
          variant={ready ? "secondary" : "primary"}
          className={ready ? "mt-4 w-full rounded-2xl" : "mt-4 w-full rounded-2xl bg-[#526f4d] hover:bg-[#425d3e]"}
          disabled={!connected}
          onClick={() => onSetReady(!ready)}
        >
          {ready ? "取消准备" : "准备"}
        </Button>
      )}
    </article>
  );
}

function StatusPill({ active, activeText, inactiveText }: { active: boolean; activeText: string; inactiveText: string }) {
  return (
    <span className={active ? "rounded-full bg-[#e5eadb] px-3 py-2 text-[#526f4d]" : "rounded-full bg-[#f3e6d2] px-3 py-2 text-[#8a6b41]"}>
      {active ? activeText : inactiveText}
    </span>
  );
}

function TutorialPanel({
  currentPlayer,
  onConfirmTutorialReady,
}: {
  currentPlayer?: OnlinePlayerSession | null;
  onConfirmTutorialReady: () => void;
}) {
  return (
    <div className="mt-5 rounded-3xl border border-[#dccdb5] bg-white p-4 shadow-[0_14px_34px_rgba(70,62,43,0.08)] sm:p-5">
      <h2 className="text-xl font-black text-[#243126]">逃出地图岛指南</h2>
      <div className="mt-4 rounded-3xl border border-[#e6dbcc] bg-[#f7f1e4] p-4">
        <div className="flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-[#78976f] bg-[#fffaf0] text-sm font-bold text-[#78976f]">
          教程示意图占位
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-7 text-[#5b6654]">
          {TUTORIAL_ITEMS.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
      <Button
        className="mt-5 w-full rounded-2xl bg-[#526f4d] py-3 text-base hover:bg-[#425d3e]"
        disabled={Boolean(currentPlayer?.tutorialReady)}
        onClick={onConfirmTutorialReady}
      >
        {currentPlayer?.tutorialReady ? "已确认，等待对方" : "我已了解，进入游戏"}
      </Button>
    </div>
  );
}
