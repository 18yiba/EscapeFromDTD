/**
 * App.tsx
 * 根组件只负责“场景分发 + 应用壳”，不要在这里堆业务逻辑。
 * 后续游戏流程与规则会分别落在 store/ 与 engine/。
 */

import { AppLayout } from "./layout/AppLayout";
import { useGameStore } from "./store/gameStore";
import { InGameHeaderActions, InGameView } from "./views/InGameView";
import { LandingView } from "./views/LandingView";
import { ResultView } from "./views/ResultView";

export default function App() {
  const scene = useGameStore((s) => s.scene);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const restart = useGameStore((s) => s.restart);

  return (
    <AppLayout headerActions={scene === "inGame" ? <InGameHeaderActions /> : null}>
      {scene === "landing" && <LandingView onEnter={startNewGame} />}
      {scene === "inGame" && <InGameView />}
      {scene === "result" && <ResultView onRestart={restart} />}
    </AppLayout>
  );
}
