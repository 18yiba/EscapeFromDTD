/**
 * InGameView：对局主界面（棋盘、手牌、操作区等）。
 * 当前仅占位，后续 MVP 实现会把棋盘渲染与交互逐步补齐。
 */

import { useState } from "react";
import { Button } from "../components/Button";
import { BoardGrid } from "../components/BoardGrid";
import { HandPanel } from "../components/HandPanel";
import { RestartConfirmModal } from "../components/RestartConfirmModal";
import { WIN_CONNECTED_LANDMARKS } from "../constants";
import { getColorLabel } from "../online/playerMapping";
import { getConnectedNetworkCandidateCellIds } from "../utils";
import type { DtdActionTarget, EngineAction, PlayerId } from "../types";
import type { OnlinePlayerRole, RoomStatus } from "../online/types";
import {
  selectCanStartWinClaim,
  selectCanEndTurn,
  selectCanConfirmPlaceRoute,
  selectCanInspectSelectedCell,
  selectIsInWinClaimMode,
  selectCanSelectHandCard,
  useGameStore,
} from "../store/gameStore";

export function InGameHeaderActions() {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const gameMode = useGameStore((s) => s.game?.gameMode ?? "hotseat");
  const game = useGameStore((s) => s.game);
  const returnToLanding = useGameStore((s) => s.returnToLanding);
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);
  const current = game ? game.players[game.currentTurn] : null;
  const turnLabel = current ? (game?.gameMode === "ai" && game.currentTurn === "blue" ? `${current.name} AI` : current.name) : "—";

  return (
    <>
      <div className="contents lg:hidden">
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setIsRestartConfirmOpen(true)}>
          重来一局
        </Button>
      </div>
      <div className="hidden min-w-0 flex-1 items-center justify-between gap-4 lg:flex">
        <Button variant="secondary" className="h-9 px-3 py-1.5 text-xs" onClick={returnToLanding}>
          返回主页
        </Button>
        {game && (
          <div className="flex min-w-0 items-center justify-center gap-5 text-[13px] font-semibold text-slate-700">
            <div className="truncate">当前回合：{turnLabel}</div>
            <div className="truncate">
              连通地标：红 {game.progress.red} / 蓝 {game.progress.blue}
            </div>
          </div>
        )}
        <Button variant="secondary" className="h-9 px-3 py-1.5 text-xs" onClick={() => setIsRestartConfirmOpen(true)}>
          重来一局
        </Button>
      </div>
      {isRestartConfirmOpen && (
        <RestartConfirmModal
          onCancel={() => setIsRestartConfirmOpen(false)}
          onConfirm={() => {
            setIsRestartConfirmOpen(false);
            startNewGame(gameMode);
          }}
        />
      )}
    </>
  );
}

export function InGameView({
  isLocked = false,
  onlineRole = null,
  localPlayerColor = null,
  roomStatus = null,
  roomVersion = null,
  onSubmitOnlineAction,
}: {
  isLocked?: boolean;
  onlineRole?: OnlinePlayerRole | null;
  localPlayerColor?: PlayerId | null;
  roomStatus?: RoomStatus | null;
  roomVersion?: number | null;
  onSubmitOnlineAction?: (action: EngineAction) => void;
}) {
  const game = useGameStore((s) => s.game);
  const ui = useGameStore((s) => s.ui);
  const selectCard = useGameStore((s) => s.selectCard);
  const selectCell = useGameStore((s) => s.selectCell);
  const selectRouteChaosTarget = useGameStore((s) => s.selectRouteChaosTarget);
  const toggleLandmarkChaosCell = useGameStore((s) => s.toggleLandmarkChaosCell);
  const rotateSelectedCardLeft = useGameStore((s) => s.rotateSelectedCardLeft);
  const rotateSelectedCardRight = useGameStore((s) => s.rotateSelectedCardRight);
  const confirmPlaceRoute = useGameStore((s) => s.confirmPlaceRoute);
  const confirmUseDtd = useGameStore((s) => s.confirmUseDtd);
  const inspectSelectedCell = useGameStore((s) => s.inspectSelectedCell);
  const showTemporaryInspectionFromOnline = useGameStore((s) => s.showTemporaryInspectionFromOnline);
  const startWinClaim = useGameStore((s) => s.startWinClaim);
  const cancelWinClaim = useGameStore((s) => s.cancelWinClaim);
  const toggleWinClaimLandmark = useGameStore((s) => s.toggleWinClaimLandmark);
  const submitWinClaim = useGameStore((s) => s.submitWinClaim);
  const endTurn = useGameStore((s) => s.endTurn);
  const returnToLanding = useGameStore((s) => s.returnToLanding);
  const showToast = useGameStore((s) => s.showToast);
  const storeCanStartWinClaim = useGameStore(selectCanStartWinClaim);
  const storeCanEndTurn = useGameStore(selectCanEndTurn);
  const storeCanInspectSelectedCell = useGameStore(selectCanInspectSelectedCell);
  const isInWinClaimMode = useGameStore(selectIsInWinClaimMode);
  const storeCanSelectHandCard = useGameStore(selectCanSelectHandCard);
  const storeCanConfirmPlaceRoute = useGameStore(selectCanConfirmPlaceRoute);

  if (!game) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">InGameView</h1>
        <div className="text-sm text-slate-600">对局尚未初始化。</div>
      </div>
    );
  }

  const current = game.players[game.currentTurn];
  const isOnlineMode = Boolean(onlineRole && localPlayerColor && onSubmitOnlineAction);
  const isOwnOnlineTurn = !isOnlineMode || localPlayerColor === game.currentTurn;
  const isInteractionLocked = isLocked || !isOwnOnlineTurn;
  const canStartWinClaim = storeCanStartWinClaim && !isInteractionLocked;
  const canEndTurn = storeCanEndTurn && !isInteractionLocked;
  const canInspectSelectedCell = storeCanInspectSelectedCell && !isInteractionLocked;
  const canSelectHandCard = storeCanSelectHandCard && !isInteractionLocked;
  const canConfirmPlaceRoute = storeCanConfirmPlaceRoute && !isInteractionLocked;
  const isAiTurn = game.gameMode === "ai" && game.currentTurn === "blue";
  const isAiThinking = ui.isAiThinking;
  const modeLabel = game.gameMode === "ai" ? "AI 对战" : "双人对战";
  const turnLabel = isAiTurn ? `${current.name} AI` : current.name;
  const visibleHandPlayer = isOnlineMode && localPlayerColor ? game.players[localPlayerColor] : game.gameMode === "ai" ? game.players.red : current;
  const selectedCard = !isAiTurn && ui.selectedCardId ? visibleHandPlayer.handCards.find((card) => card.id === ui.selectedCardId) ?? null : null;
  const isRouteCardSelected = selectedCard?.kind === "route";
  const selectedDtdType = selectedCard?.kind === "dtd" ? selectedCard.type : null;
  const isCurrentTurnSkipped = game.playerEffects[game.currentTurn].skipNextTurn;
  const isWinClaimReviewing = Boolean(game.winClaim?.validationResult);
  const feedbackPlayerName = ui.ruleFeedback ? game.players[ui.ruleFeedback.playerId].name : "—";
  const feedbackConnected = ui.ruleFeedback ? ui.ruleFeedback.connectedCount : 0;
  const feedbackThreshold = ui.ruleFeedback ? ui.ruleFeedback.threshold : WIN_CONNECTED_LANDMARKS;
  const feedbackFormed = ui.ruleFeedback ? (ui.ruleFeedback.formedAfterPlacement ? "是" : "否") : "—";
  const selectedClaimLandmarkCellIds = game.winClaim?.selectedLandmarkCellIds ?? [];
  const winClaimCandidateCellIds = isInWinClaimMode ? getConnectedNetworkCandidateCellIds(game.board) : [];
  const ruleFeedbackText = `反馈：${feedbackPlayerName} · 连通 ${feedbackConnected}/${feedbackThreshold} · 有效 ${feedbackFormed}`;
  const canConfirmUseDtd =
    !isInteractionLocked &&
    (selectedDtdType === "space-anxiety" ||
      (selectedDtdType === "route-chaos" && ui.routeChaosTarget !== null) ||
      (selectedDtdType === "landmark-chaos" && ui.landmarkChaosCellIds.length === 2));
  const routeChaosTargetText =
    ui.routeChaosTarget?.axis === "row"
      ? `第 ${ui.routeChaosTarget.index + 1} 行`
      : ui.routeChaosTarget?.axis === "col"
      ? `第 ${ui.routeChaosTarget.index + 1} 列`
      : "未选择";
  const actionButtonClass =
    "min-h-[2.75rem] rounded-[18px] border border-[#1f2d44] px-4 py-2 text-sm font-semibold " +
    "!bg-[#1f2d44] !text-white hover:!bg-[#2d4263] " +
    "disabled:!border-[#9aa3af] disabled:!bg-[#9aa3af] disabled:!text-white disabled:!opacity-100 disabled:hover:!bg-[#9aa3af]";
  const primaryActionButtonClass = actionButtonClass;
  const onlineIdentityText =
    isOnlineMode && localPlayerColor
      ? `你是${getColorLabel(localPlayerColor)} · 当前${getColorLabel(game.currentTurn)}回合${roomVersion != null ? ` · v${roomVersion}` : ""}`
      : null;

  const submitOnlineOrLocal = (action: EngineAction, localSubmit: () => void) => {
    if (!isOnlineMode || !onSubmitOnlineAction || !localPlayerColor) {
      localSubmit();
      return;
    }
    if (roomStatus !== "playing") return;
    if (game.currentTurn !== localPlayerColor) {
      showToast({ open: true, level: "info", message: "等待对方行动。" });
      return;
    }
    if (action.type === "inspectCell") {
      const inspectedCell = game.board.cells.find((cell) => cell.id === action.cellId);
      if (inspectedCell?.hidden) {
        showTemporaryInspectionFromOnline(action.cellId, inspectedCell.hidden);
      }
    }
    onSubmitOnlineAction(action);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-y-auto sm:gap-3 sm:overflow-hidden lg:grid lg:grid-cols-[minmax(760px,1fr)_340px] lg:gap-6 lg:overflow-hidden">
      <div className="shrink-0 lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#e6dbcc] bg-white/75 px-3 py-2 shadow-[0_8px_24px_rgba(70,62,43,0.05)]">
          <div className="flex min-w-0 items-start gap-2">
            <Button
              variant="secondary"
              className="h-8 w-8 shrink-0 rounded-xl bg-[#eef1ea] px-0 py-0 text-base text-slate-800 hover:bg-white"
              aria-label="返回模式选择"
              onClick={returnToLanding}
            >
              ←
            </Button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500">模式：{modeLabel}</div>
              {onlineIdentityText && <div className="text-xs font-semibold text-emerald-700">{onlineIdentityText}</div>}
              <div className="text-xs text-slate-500">当前回合</div>
              <div className="text-xl font-semibold text-slate-900">{turnLabel}</div>
              {isAiTurn && (
                <div className="text-xs font-medium text-sky-700">
                  {isAiThinking ? "AI 正在思考..." : "AI 正在行动"}
                </div>
              )}
              {isCurrentTurnSkipped && <div className="text-xs font-medium text-orange-700">受到空间焦虑影响，本回合跳过行动</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">连通地标</div>
            <div className="text-sm font-medium text-slate-700">
              红 {game.progress.red} / 蓝 {game.progress.blue}
            </div>
          </div>
        </div>
        {canStartWinClaim && (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
            已满足宣告条件
          </div>
        )}
      </div>

      <div className="flex w-full shrink-0 items-center justify-center overflow-visible rounded-[24px] bg-white/80 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:min-h-0 sm:flex-1 sm:overflow-hidden sm:p-3 lg:min-h-0 lg:shrink lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="relative flex w-full items-center justify-center lg:w-[min(74vh,900px)] lg:max-w-[80vw] lg:rounded-[24px] lg:bg-white/80 lg:p-4 lg:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <BoardGrid
            board={game.board}
            selectedCellId={ui.selectedCellId}
            temporaryInspectedLandmarks={ui.temporaryInspectedLandmarks}
            temporaryInspectedBlankCellIds={ui.temporaryInspectedBlankCellIds}
            highlightedCellIds={isInWinClaimMode ? winClaimCandidateCellIds : []}
            claimSelectedCellIds={selectedClaimLandmarkCellIds}
            claimValidationResult={isWinClaimReviewing ? game.winClaim?.validationResult : undefined}
            landmarkChaosSelectedCellIds={selectedDtdType === "landmark-chaos" ? ui.landmarkChaosCellIds : []}
            showAllHiddenContent={isWinClaimReviewing}
            useRouteOverlay={isWinClaimReviewing}
            showRouteChaosSelectors={selectedDtdType === "route-chaos" && !isInWinClaimMode}
            routeChaosTarget={ui.routeChaosTarget}
            onSelectRouteChaosTarget={(target) => {
              if (!isInteractionLocked) selectRouteChaosTarget(target);
            }}
            onSelectCell={(id) => {
              if (isInteractionLocked) return;
              if (isInWinClaimMode) {
                submitOnlineOrLocal({ type: "toggleWinClaimLandmark", playerId: game.currentTurn, cellId: id }, () => toggleWinClaimLandmark(id));
                return;
              }
              if (selectedDtdType === "landmark-chaos") {
                toggleLandmarkChaosCell(id);
                return;
              }
              selectCell(id);
            }}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 overflow-visible sm:gap-3 sm:flex-row sm:items-start lg:min-h-0 lg:w-[340px] lg:flex-col lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-[#e6dbcc] lg:bg-white/75 lg:p-4 lg:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        {isInWinClaimMode ? (
          <WinClaimSidePanel
            selectedCellIds={selectedClaimLandmarkCellIds}
            requiredCount={feedbackThreshold}
            candidateCount={winClaimCandidateCellIds.length}
            isReviewing={isWinClaimReviewing}
            validationResult={game.winClaim?.validationResult}
            isInteractionLocked={isInteractionLocked}
            onCancel={() => submitOnlineOrLocal({ type: "cancelWinClaim", playerId: game.currentTurn }, cancelWinClaim)}
            onSubmit={() => submitOnlineOrLocal({ type: "submitWinClaim", playerId: game.currentTurn }, submitWinClaim)}
            actionButtonClass={actionButtonClass}
            primaryActionButtonClass={primaryActionButtonClass}
          />
        ) : (
          <>
            <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2 lg:flex lg:min-h-0 lg:w-full lg:flex-col lg:space-y-3 lg:overflow-hidden">
              <div className="text-xs font-semibold text-slate-800 lg:text-sm lg:text-slate-900">
                {game.gameMode === "ai" ? "红方手牌" : "手牌"}（{visibleHandPlayer.handCards.length}）
              </div>
              {onlineIdentityText && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                  {onlineIdentityText}
                </div>
              )}
              <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
                <HandPanel
                  cards={visibleHandPlayer.handCards}
                  selectedCardId={ui.selectedCardId}
                  selectedRotation={ui.selectedRotation}
                  disabled={!canSelectHandCard}
                  onSelect={(id) => {
                    if (!isInteractionLocked) selectCard(id);
                  }}
                />
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-[11px] leading-4 text-slate-600 lg:text-xs">
                {ruleFeedbackText}
              </div>
              {isAiTurn && (
                <div className="hidden text-xs font-medium text-sky-700 lg:block">
                  {isAiThinking ? "AI 正在思考..." : "AI 正在行动"}
                </div>
              )}
              {isCurrentTurnSkipped && (
                <div className="hidden rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700 lg:block">
                  受到空间焦虑影响，本回合跳过行动
                </div>
              )}
              {canStartWinClaim && (
                <div className="hidden rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 lg:block">
                  已满足宣告条件
                </div>
              )}
            </div>

            <div className="w-full shrink-0 overflow-visible rounded-[24px] border border-[#e6dbcc] bg-white/75 p-2.5 shadow-[0_8px_24px_rgba(70,62,43,0.05)] sm:w-72 lg:w-full lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="flex flex-col gap-2 overflow-visible">
                {isRouteCardSelected && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className={`px-3 text-xs ${actionButtonClass}`} disabled={isInteractionLocked} onClick={rotateSelectedCardLeft}>
                  左旋
                </Button>
                <Button variant="secondary" className={`px-3 text-xs ${actionButtonClass}`} disabled={isInteractionLocked} onClick={rotateSelectedCardRight}>
                  右旋
                </Button>
              </div>
            )}

                {selectedDtdType === "space-anxiety" && (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                    目标：{game.players[game.currentTurn === "red" ? "blue" : "red"].name}
                  </div>
                )}

                {selectedDtdType === "route-chaos" && (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                    目标：{routeChaosTargetText}
                  </div>
                )}

                {selectedDtdType === "landmark-chaos" && (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs text-orange-900">
                    已选：{ui.landmarkChaosCellIds.length}/2
                  </div>
                )}

                {selectedDtdType && (
                  <Button
                    className={primaryActionButtonClass}
                    disabled={!canConfirmUseDtd}
                    onClick={() => {
                      if (!selectedCard || selectedCard.kind !== "dtd") return;
                      const playerId = game.currentTurn;
                      const opponentId: PlayerId = playerId === "red" ? "blue" : "red";
                      const target: DtdActionTarget | null =
                        selectedCard.type === "space-anxiety"
                          ? { type: "player", playerId: opponentId }
                          : selectedCard.type === "route-chaos" && ui.routeChaosTarget
                          ? { type: "line", ...ui.routeChaosTarget }
                          : selectedCard.type === "landmark-chaos" && ui.landmarkChaosCellIds.length === 2
                          ? { type: "cells", cellIds: [ui.landmarkChaosCellIds[0], ui.landmarkChaosCellIds[1]] }
                          : null;
                      if (!target) return;
                      submitOnlineOrLocal({ type: "useDtd", playerId, cardId: selectedCard.id, target }, confirmUseDtd);
                    }}
                  >
                    确认使用 DTD
                  </Button>
                )}

                {canInspectSelectedCell && !selectedDtdType && (
                  <Button
                    variant="secondary"
                    className={actionButtonClass}
                    onClick={() => submitOnlineOrLocal({ type: "inspectCell", playerId: game.currentTurn, cellId: ui.selectedCellId! }, inspectSelectedCell)}
                  >
                    查看地标
                  </Button>
                )}

                {canStartWinClaim && !selectedDtdType && (
                  <Button
                    variant="secondary"
                    className={actionButtonClass}
                    onClick={() => submitOnlineOrLocal({ type: "startWinClaim", playerId: game.currentTurn }, startWinClaim)}
                  >
                    宣布胜利
                  </Button>
                )}

                {canEndTurn && (
                  <Button variant="secondary" className={actionButtonClass} onClick={() => submitOnlineOrLocal({ type: "endTurn" }, endTurn)}>
                    {isCurrentTurnSkipped ? "跳过回合" : "结束回合"}
                  </Button>
                )}

                <Button
                  className={primaryActionButtonClass}
                  disabled={isInteractionLocked || !canConfirmPlaceRoute || Boolean(selectedDtdType)}
                  onClick={() =>
                    submitOnlineOrLocal(
                      {
                        type: "placeRoute",
                        playerId: game.currentTurn,
                        cardId: ui.selectedCardId!,
                        cellId: ui.selectedCellId!,
                        rotation: ui.selectedRotation,
                      },
                      () =>
                        confirmPlaceRoute({
                          playerId: game.currentTurn,
                          cardId: ui.selectedCardId!,
                          cellId: ui.selectedCellId!,
                          rotation: ui.selectedRotation,
                        })
                    )
                  }
                >
                  确认放置
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WinClaimSidePanel({
  selectedCellIds,
  requiredCount,
  candidateCount,
  isReviewing,
  validationResult,
  isInteractionLocked,
  onCancel,
  onSubmit,
  actionButtonClass,
  primaryActionButtonClass,
}: {
  selectedCellIds: number[];
  requiredCount: number;
  candidateCount: number;
  isReviewing: boolean;
  validationResult?: Record<number, "correct" | "incorrect">;
  isInteractionLocked: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  actionButtonClass: string;
  primaryActionButtonClass: string;
}) {
  const selectedSummary = selectedCellIds.length > 0 ? selectedCellIds.map((cellId) => cellId + 1).join("、") : "尚未选择";

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 overflow-visible rounded-[24px] border border-[#e6dbcc] bg-white/75 p-3 shadow-[0_8px_24px_rgba(70,62,43,0.05)] sm:w-72 lg:min-h-0 lg:w-full lg:flex-1 lg:overflow-hidden lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <div className="space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <div>
          <div className="text-xs font-semibold text-slate-500">胜利内容</div>
          <h2 className="mt-1 text-lg font-black text-slate-900">胜利验证</h2>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-900">
          在左侧棋盘中选择当前连通路线网络里的己方地标。棋盘会保留路线、地标和验证标记。
        </div>

        <div className="grid grid-cols-2 gap-2">
          <WinClaimStat label="已选" value={`${selectedCellIds.length}/${requiredCount}`} />
          <WinClaimStat label="可验证" value={`${candidateCount}`} />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs leading-5 text-slate-600">
          <div className="font-semibold text-slate-800">已选格子</div>
          <div className="mt-1">{selectedSummary}</div>
        </div>

        {isReviewing && validationResult && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
            <div className="font-semibold">验证结果已显示在棋盘上</div>
            <div className="mt-1">
              正确 {Object.values(validationResult).filter((mark) => mark === "correct").length} / 错误{" "}
              {Object.values(validationResult).filter((mark) => mark === "incorrect").length}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <Button variant="secondary" className={`w-full ${actionButtonClass}`} disabled={isInteractionLocked} onClick={onCancel}>
          取消宣告
        </Button>
        <Button className={`w-full ${primaryActionButtonClass}`} disabled={isInteractionLocked} onClick={onSubmit}>
          提交验证
        </Button>
      </div>
    </div>
  );
}

function WinClaimStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
    </div>
  );
}
