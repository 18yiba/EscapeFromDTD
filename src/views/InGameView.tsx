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
import { getConnectedNetworkCandidateCellIds } from "../utils";
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
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setIsRestartConfirmOpen(true)}>
        重来一局
      </Button>
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

export function InGameView() {
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
  const startWinClaim = useGameStore((s) => s.startWinClaim);
  const cancelWinClaim = useGameStore((s) => s.cancelWinClaim);
  const toggleWinClaimLandmark = useGameStore((s) => s.toggleWinClaimLandmark);
  const submitWinClaim = useGameStore((s) => s.submitWinClaim);
  const endTurn = useGameStore((s) => s.endTurn);
  const returnToLanding = useGameStore((s) => s.returnToLanding);
  const canStartWinClaim = useGameStore(selectCanStartWinClaim);
  const canEndTurn = useGameStore(selectCanEndTurn);
  const canInspectSelectedCell = useGameStore(selectCanInspectSelectedCell);
  const isInWinClaimMode = useGameStore(selectIsInWinClaimMode);
  const canSelectHandCard = useGameStore(selectCanSelectHandCard);
  const canConfirmPlaceRoute = useGameStore(selectCanConfirmPlaceRoute);

  if (!game) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">InGameView</h1>
        <div className="text-sm text-slate-600">对局尚未初始化。</div>
      </div>
    );
  }

  const current = game.players[game.currentTurn];
  const isAiTurn = game.gameMode === "ai" && game.currentTurn === "blue";
  const isAiThinking = ui.isAiThinking;
  const modeLabel = game.gameMode === "ai" ? "AI 对战" : "双人对战";
  const turnLabel = isAiTurn ? `${current.name} AI` : current.name;
  const selectedCard = ui.selectedCardId ? current.handCards.find((card) => card.id === ui.selectedCardId) ?? null : null;
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
    selectedDtdType === "space-anxiety" ||
    (selectedDtdType === "route-chaos" && ui.routeChaosTarget !== null) ||
    (selectedDtdType === "landmark-chaos" && ui.landmarkChaosCellIds.length === 2);
  const routeChaosTargetText =
    ui.routeChaosTarget?.axis === "row"
      ? `第 ${ui.routeChaosTarget.index + 1} 行`
      : ui.routeChaosTarget?.axis === "col"
      ? `第 ${ui.routeChaosTarget.index + 1} 列`
      : "未选择";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-y-auto sm:gap-3 sm:overflow-hidden">
      <div className="shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <Button
              variant="secondary"
              className="h-8 w-8 shrink-0 px-0 py-0 text-base"
              aria-label="返回模式选择"
              onClick={returnToLanding}
            >
              ←
            </Button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500">模式：{modeLabel}</div>
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
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
            已满足宣告条件
          </div>
        )}
      </div>

      <div className="flex w-full shrink-0 items-center justify-center overflow-visible rounded-lg border border-slate-200 bg-slate-50 p-1.5 sm:min-h-0 sm:flex-1 sm:overflow-hidden sm:p-3">
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
          onSelectRouteChaosTarget={selectRouteChaosTarget}
          onSelectCell={(id) => {
            if (isInWinClaimMode) {
              toggleWinClaimLandmark(id);
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

      <div className="flex shrink-0 flex-col gap-2 overflow-visible sm:gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
          <div className="text-xs font-medium text-slate-700">手牌（{current.handCards.length}）</div>
          <HandPanel
            cards={current.handCards}
            selectedCardId={ui.selectedCardId}
            selectedRotation={ui.selectedRotation}
            disabled={!canSelectHandCard}
            onSelect={(id) => selectCard(id)}
          />
          <div className="text-[11px] leading-4 text-slate-500">{ruleFeedbackText}</div>
        </div>

        <div className="w-full shrink-0 rounded-lg border border-slate-200 bg-white p-2 overflow-visible sm:w-72 sm:p-2.5">
          {isAiThinking && (
            <div className="mb-2 rounded-md border border-sky-100 bg-sky-50 px-2 py-1.5 text-xs font-medium text-sky-800">
              蓝方 AI 思考中
            </div>
          )}
          {isInWinClaimMode && (
            <div className="mb-1.5 text-right text-[11px] text-slate-500">
              已选 {selectedClaimLandmarkCellIds.length}/{feedbackThreshold}
            </div>
          )}
          <div className="flex flex-col gap-2 overflow-visible">
            {!isInWinClaimMode && isRouteCardSelected && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="px-3 text-xs" onClick={rotateSelectedCardLeft}>
                  左旋
                </Button>
                <Button variant="secondary" className="px-3 text-xs" onClick={rotateSelectedCardRight}>
                  右旋
                </Button>
              </div>
            )}

            {isInWinClaimMode ? (
              <>
                <Button variant="secondary" className="w-full" onClick={cancelWinClaim}>
                  取消宣告
                </Button>
                <Button className="w-full" onClick={submitWinClaim}>
                  提交验证
                </Button>
              </>
            ) : (
              <>
                {selectedDtdType === "space-anxiety" && (
                  <div className="rounded-md border border-orange-100 bg-orange-50 px-2 py-1.5 text-xs text-orange-900">
                    目标：{game.players[game.currentTurn === "red" ? "blue" : "red"].name}
                  </div>
                )}

                {selectedDtdType === "route-chaos" && (
                  <div className="rounded-md border border-orange-100 bg-orange-50 px-2 py-1.5 text-xs text-orange-900">
                    目标：{routeChaosTargetText}
                  </div>
                )}

                {selectedDtdType === "landmark-chaos" && (
                  <div className="rounded-md border border-orange-100 bg-orange-50 px-2 py-1.5 text-xs text-orange-900">
                    已选：{ui.landmarkChaosCellIds.length}/2
                  </div>
                )}

                {selectedDtdType && (
                  <Button disabled={!canConfirmUseDtd} onClick={confirmUseDtd}>
                    确认使用 DTD
                  </Button>
                )}

                {canInspectSelectedCell && !selectedDtdType && (
                  <Button variant="secondary" onClick={inspectSelectedCell}>
                    查看地标
                  </Button>
                )}

                {canStartWinClaim && !selectedDtdType && (
                  <Button variant="secondary" onClick={startWinClaim}>
                    宣布胜利
                  </Button>
                )}

                {canEndTurn && (
                  <Button variant="secondary" onClick={endTurn}>
                    {isCurrentTurnSkipped ? "跳过回合" : "结束回合"}
                  </Button>
                )}

                <Button
                  disabled={!canConfirmPlaceRoute || Boolean(selectedDtdType)}
                  onClick={() =>
                    confirmPlaceRoute({
                      playerId: game.currentTurn,
                      cardId: ui.selectedCardId!,
                      cellId: ui.selectedCellId!,
                      rotation: ui.selectedRotation,
                    })
                  }
                >
                  确认放置
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
