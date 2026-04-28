/**
 * views/
 * 页面级内容：每个 view 对应一个“场景/页面”。
 * 这里先做最小占位，避免在 App.tsx 里堆页面内容。
 */

import { Button } from "../components/Button";
import type { GameMode } from "../types";

export function LandingView({ onEnter }: { onEnter: (mode: GameMode) => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">逃出地图岛</h1>
      <p className="text-sm text-slate-600">准备路线，寻找地标，抵达终点。</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => onEnter("hotseat")}>双人对战</Button>
        <Button variant="secondary" onClick={() => onEnter("ai")}>
          AI 对战
        </Button>
      </div>
    </div>
  );
}
