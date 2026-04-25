/**
 * views/
 * 页面级内容：每个 view 对应一个“场景/页面”。
 * 这里先做最小占位，避免在 App.tsx 里堆页面内容。
 */

import { Button } from "../components/Button";

export function LandingView({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">逃出地图岛</h1>
      <p className="text-sm text-slate-600">准备路线，寻找地标，抵达终点。</p>
      <Button onClick={onEnter}>进入游戏</Button>
    </div>
  );
}
