import type { Goal } from "../game/types";
import { StarRating } from "./StarRating";

type Props = {
  levelName: string;
  levelId: number;
  goal: Goal;
  par: number;
  stars?: number;
  showPar?: boolean;
};

function goalText(goal: Goal): string {
  if (goal.resolveParadox) return "Resolve the paradox";
  if (goal.allInevitable) return "Make all states inevitable";
  if (goal.inevitableCount != null && goal.impossibleCount != null && goal.possibleCount != null)
    return `Make ${goal.inevitableCount} inevitable, ${goal.impossibleCount} impossible, ${goal.possibleCount} possible`;
  if (goal.inevitableCount != null && goal.impossibleCount != null && goal.possibleRest)
    return `Make ${goal.inevitableCount} inevitable, ${goal.impossibleCount} impossible, rest possible`;
  if (goal.inevitableCount != null && goal.impossibleCount != null)
    return `Make ${goal.inevitableCount} inevitable, ${goal.impossibleCount} impossible`;
  if (goal.inevitable?.length)
    return `Make ${goal.inevitable.join(", ")} inevitable`;
  if (goal.impossible?.length)
    return `Make ${goal.impossible.join(", ")} impossible`;
  if (goal.possible?.length)
    return `Keep ${goal.possible.join(", ")} possible`;
  return "Free play";
}

export function GoalBar({ levelName, levelId, goal, par, stars = 0, showPar = true }: Props) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--card)]/80 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <p className="font-mono text-sm text-[var(--muted)]">
          Level {levelId}: {levelName}
        </p>
        <p className="truncate text-sm text-[var(--text)]">{goalText(goal)}</p>
      </div>
      {showPar && par > 0 && (
        <StarRating stars={stars} par={par} size="sm" />
      )}
    </header>
  );
}
