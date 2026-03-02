import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { StarField } from "./components/StarField";
import { TitleScreen } from "./components/TitleScreen";
import { LevelSelect } from "./components/LevelSelect";
import { GameScreen } from "./components/GameScreen";
import { LevelComplete } from "./components/LevelComplete";
import { LEVELS } from "./game/levels";
import type { GameState, PlacedRule } from "./game/types";

function defaultCompleted(): Map<number, { stars: number; rulesUsed: number }> {
  return new Map();
}

export default function App() {
  const [screen, setScreen] = useState<GameState["screen"]>("title");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState(defaultCompleted);
  const [placedRules, setPlacedRules] = useState<PlacedRule[]>([]);
  const [completePayload, setCompletePayload] = useState<{
    stars: number;
    rulesUsed: number;
  } | null>(null);

  const handleLevelComplete = useCallback((stars: number, rulesUsed: number) => {
    setCompletePayload({ stars, rulesUsed });
    setCompletedLevels((prev) => {
      const next = new Map(prev);
      next.set(currentLevel, { stars, rulesUsed });
      return next;
    });
    setScreen("complete");
  }, [currentLevel]);

  const handleNextLevel = useCallback(() => {
    setCurrentLevel((l) => Math.min(20, l + 1));
    setPlacedRules([]);
    setCompletePayload(null);
    setScreen("game");
  }, []);

  const handleLevelSelect = useCallback(() => {
    setScreen("select");
    setCompletePayload(null);
  }, []);

  const handleSelectLevel = useCallback((id: number) => {
    setCurrentLevel(id);
    setPlacedRules([]);
    setScreen("game");
  }, []);

  return (
    <div className="relative min-h-full bg-[var(--bg)] text-[var(--text)]">
      <StarField />
      <AnimatePresence mode="wait">
        {screen === "title" && (
          <TitleScreen key="title" onBegin={() => setScreen("select")} />
        )}
        {screen === "select" && (
          <LevelSelect
            key="select"
            completedLevels={completedLevels}
            onSelectLevel={handleSelectLevel}
            onBack={() => setScreen("title")}
          />
        )}
        {screen === "game" && (
          <GameScreen
            key={`game-${currentLevel}`}
            levelId={currentLevel}
            placedRules={placedRules}
            onPlacedRulesChange={setPlacedRules}
            onBack={() => setScreen("select")}
            onLevelComplete={handleLevelComplete}
            completedStars={completedLevels.get(currentLevel)?.stars}
          />
        )}
      </AnimatePresence>
      {screen === "complete" && completePayload && (
        <LevelComplete
          levelName={LEVELS.find((l) => l.id === currentLevel)?.name ?? ""}
          levelId={currentLevel}
          stars={completePayload.stars}
          par={LEVELS.find((l) => l.id === currentLevel)?.par ?? 0}
          rulesUsed={completePayload.rulesUsed}
          onNext={handleNextLevel}
          onLevelSelect={handleLevelSelect}
        />
      )}
    </div>
  );
}
