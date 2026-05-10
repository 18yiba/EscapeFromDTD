/**
 * App.tsx
 * 根组件只负责“场景分发 + 应用壳”，不要在这里堆业务逻辑。
 * 后续游戏流程与规则会分别落在 store/ 与 engine/。
 */

import { useEffect, useRef } from "react";
import { initializeGame } from "./engine";
import { AppLayout } from "./layout/AppLayout";
import { getLocalPlayerColor } from "./online/playerMapping";
import { useGameStore } from "./store/gameStore";
import { selectIsOnlineGameLocked, useOnlineRoomStore } from "./store/onlineRoomStore";
import { InGameHeaderActions, InGameView } from "./views/InGameView";
import { LandingView } from "./views/LandingView";
import { OnlineRoomOverlay } from "./views/OnlineRoomOverlay";
import { ResultView } from "./views/ResultView";

export default function App() {
  const scene = useGameStore((s) => s.scene);
  const game = useGameStore((s) => s.game);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const restart = useGameStore((s) => s.restart);
  const onlineRoom = useOnlineRoomStore((s) => s.room);
  const onlineRole = useOnlineRoomStore((s) => s.role);
  const copiedLink = useOnlineRoomStore((s) => s.copiedLink);
  const onlineStatus = useOnlineRoomStore((s) => s.connectionStatus);
  const onlineError = useOnlineRoomStore((s) => s.errorMessage);
  const isOnlineLocked = useOnlineRoomStore(selectIsOnlineGameLocked);
  const hasInitializedFromUrl = useOnlineRoomStore((s) => s.hasInitializedFromUrl);
  const createRoom = useOnlineRoomStore((s) => s.createRoom);
  const joinRoom = useOnlineRoomStore((s) => s.joinRoom);
  const initializeFromUrl = useOnlineRoomStore((s) => s.initializeFromUrl);
  const setReady = useOnlineRoomStore((s) => s.setReady);
  const startTutorial = useOnlineRoomStore((s) => s.startTutorial);
  const confirmTutorialReady = useOnlineRoomStore((s) => s.confirmTutorialReady);
  const initOnlineGame = useOnlineRoomStore((s) => s.initOnlineGame);
  const submitOnlineAction = useOnlineRoomStore((s) => s.submitOnlineAction);
  const markCopied = useOnlineRoomStore((s) => s.markCopied);
  const hydrateGameFromOnline = useGameStore((s) => s.hydrateGameFromOnline);
  const showTemporaryInspectionFromOnline = useGameStore((s) => s.showTemporaryInspectionFromOnline);
  const lastRenderedInspectionKey = useRef<string | null>(null);

  useEffect(() => {
    if (!hasInitializedFromUrl) {
      void initializeFromUrl();
    }
  }, [hasInitializedFromUrl, initializeFromUrl]);

  useEffect(() => {
    if (!onlineRoom || !onlineRole) return;
    if (onlineRoom.gameState) {
      if (game !== onlineRoom.gameState) {
        hydrateGameFromOnline(onlineRoom.gameState);
      }
      return;
    }
    if (onlineRole === "host") {
      void initOnlineGame(initializeGame("hotseat"));
    }
  }, [game, hydrateGameFromOnline, initOnlineGame, onlineRole, onlineRoom]);

  useEffect(() => {
    const inspection = onlineRoom?.lastInspection;
    if (!inspection || Date.now() > inspection.expiresAt) return;
    const inspectionKey = `${inspection.by}:${inspection.cellId}:${inspection.at}`;
    if (lastRenderedInspectionKey.current === inspectionKey) return;
    lastRenderedInspectionKey.current = inspectionKey;
    showTemporaryInspectionFromOnline(inspection.cellId, inspection.content);
  }, [onlineRoom?.lastInspection, showTemporaryInspectionFromOnline]);

  const copyRoomCode = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    markCopied("inviteCode");
  };

  if (onlineRoom && onlineRole) {
    return (
      <AppLayout variant="game" headerActions={<InGameHeaderActions />}>
        <div className="relative flex min-h-0 w-full flex-1">
          {game ? (
            <InGameView
              isLocked={isOnlineLocked}
              onlineRole={onlineRole}
              localPlayerColor={getLocalPlayerColor(onlineRole)}
              roomStatus={onlineRoom.roomStatus}
              roomVersion={onlineRoom.version}
              onSubmitOnlineAction={(action) => void submitOnlineAction(action)}
            />
          ) : (
            <div className="p-4 text-sm text-slate-600">正在加载游戏界面...</div>
          )}
          <OnlineRoomOverlay
            room={onlineRoom}
            role={onlineRole}
            copiedLink={copiedLink}
            errorMessage={onlineError}
            onCopy={(value) => void copyRoomCode(value)}
            onSetReady={(ready) => void setReady(ready)}
            onStartTutorial={() => void startTutorial()}
            onConfirmTutorialReady={() => void confirmTutorialReady()}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout variant={scene === "landing" ? "landing" : "game"} headerActions={scene === "inGame" ? <InGameHeaderActions /> : null}>
      {scene === "landing" && (
        <LandingView
          onEnter={startNewGame}
          onCreateOnlineRoom={() => void createRoom()}
          onJoinOnlineRoom={(roomId) => void joinRoom(roomId)}
          onlineStatus={onlineStatus}
          onlineError={onlineError}
        />
      )}
      {scene === "inGame" && <InGameView />}
      {scene === "result" && <ResultView onRestart={restart} />}
    </AppLayout>
  );
}
