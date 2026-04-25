/**
 * ResultView：结算/结果页（或结果态容器）。
 */

import { Button } from "../components/Button";
import { BoardGrid } from "../components/BoardGrid";
import { useGameStore } from "../store/gameStore";
import { bfsReachableFromFinish, getConnectedLandmarkCellIds } from "../utils";

export function ResultView({ onRestart }: { onRestart: () => void }) {
  const game = useGameStore((s) => s.game);
  const connectedCellIds = game ? Array.from(bfsReachableFromFinish(game.board)) : [];
  const claimedLandmarkCellIds = game?.winClaim?.selectedLandmarkCellIds ?? [];
  const connectedLandmarkCellIds = game?.winnerId ? getConnectedLandmarkCellIds(game.board, game.winnerId) : [];
  const claimant = game?.winClaim?.claimant ?? null;
  const claimSucceeded = Boolean(game?.winnerId && claimant && game.winnerId === claimant);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{claimSucceeded ? "宣告成功复盘" : "宣告失败结算"}</h1>
      <p className="text-sm text-slate-600">
        {game?.winnerId ? `赢家：${game.players[game.winnerId].name}` : "结果占位（未产生赢家）"}
      </p>
      {game && (
        <>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {claimSucceeded
              ? `宣告验证成功：已验证 ${claimedLandmarkCellIds.length} 张牌，当前与 Finish 连通的胜方地标 ${connectedLandmarkCellIds.length} 个。`
              : `宣告验证失败：翻验的 ${claimedLandmarkCellIds.length} 张牌中存在非宣告玩家地标或空白牌，游戏直接结束。`}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <BoardGrid
              board={game.board}
              selectedCellId={null}
              temporaryInspectedLandmarks={{}}
              displayMode="review"
              connectedCellIds={connectedCellIds}
              highlightedCellIds={connectedLandmarkCellIds}
              claimSelectedCellIds={claimedLandmarkCellIds}
              onSelectCell={() => {}}
            />
          </div>
        </>
      )}
      <Button variant="secondary" onClick={onRestart}>
        再来一局
      </Button>
    </div>
  );
}
