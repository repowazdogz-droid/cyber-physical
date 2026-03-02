import { useCallback, useMemo, useRef, useState } from "react";
import {
  analyze,
  buildUniverse,
  checkGoal,
} from "../game/engineBridge";
import { nextId } from "../engine/util";
import type { PlacedRule, RuleTemplate } from "../game/types";
import { LEVELS } from "../game/levels";
import { GoalBar } from "./GoalBar";
import { RuleTray } from "./RuleTray";
import { StateOrb } from "./StateOrb";
import type { OrbStatus } from "./StateOrb";

type Props = {
  levelId: number;
  placedRules: PlacedRule[];
  onPlacedRulesChange: (rules: PlacedRule[]) => void;
  onBack: () => void;
  onLevelComplete: (stars: number, rulesUsed: number) => void;
  completedStars?: number;
};

type PlacementState =
  | null
  | { kind: "pair"; templateIndex: number; first: string }
  | { kind: "set"; templateIndex: number; set: string[] };

export function GameScreen({
  levelId,
  placedRules,
  onPlacedRulesChange,
  onBack,
  onLevelComplete,
  completedStars = 0,
}: Props) {
  const level = LEVELS.find((l) => l.id === levelId)!;
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [placement, setPlacement] = useState<PlacementState>(null);
  const hadContradictionRef = useRef(false);

  const universe = useMemo(
    () => buildUniverse(level.states, placedRules),
    [level.states, placedRules]
  );
  const analysis = useMemo(() => analyze(universe), [universe]);

  if (analysis.allowedWorldCount === 0) hadContradictionRef.current = true;

  const unlimited = level.par === 0 && Object.keys(level.goal).length === 0;

  const getStatus = useCallback(
    (s: string): OrbStatus => {
      if (analysis.inevitable.has(s)) return "inevitable";
      if (analysis.impossible.has(s)) return "impossible";
      return "possible";
    },
    [analysis]
  );

  const goalMet = useMemo(
    () =>
      checkGoal(
        level.goal,
        analysis,
        level.states,
        level.goal.resolveParadox ? hadContradictionRef.current : undefined
      ),
    [level.goal, level.states, analysis]
  );

  const handleOrbSelect = useCallback(
    (stateId: string) => {
      if (selectedTemplateIndex == null) return;
      const t = level.availableRules[selectedTemplateIndex] as RuleTemplate;

      if (placement?.kind === "pair") {
        const second = stateId;
        if (second === placement.first) return;
        const a = t.type === "REQUIRES" ? placement.first : placement.first;
        const b = second;
        const newRule: PlacedRule = {
          id: nextId("r"),
          type: t.type === "REQUIRES" ? "REQUIRES" : "NOT_TOGETHER",
          a,
          b,
          label: t.type === "REQUIRES" ? `${a} needs ${b}` : `${a} and ${b} can't coexist`,
        };
        onPlacedRulesChange([...placedRules, newRule]);
        setPlacement(null);
        setSelectedTemplateIndex(null);
        return;
      }

      if (placement?.kind === "set") {
        const set = placement.set.includes(stateId)
          ? placement.set.filter((x) => x !== stateId)
          : [...placement.set, stateId];
        setPlacement({ kind: "set", templateIndex: placement.templateIndex, set });
        return;
      }

      if (t.type === "NOT_TOGETHER" || t.type === "REQUIRES") {
        setPlacement({ kind: "pair", templateIndex: selectedTemplateIndex, first: stateId });
        return;
      }

      if (t.type === "AT_MOST_K" || t.type === "EXACTLY_K") {
        if (t.fixedSet != null && t.fixedK != null) {
          const newRule: PlacedRule = {
            id: nextId("r"),
            type: t.type === "AT_MOST_K" ? "AT_MOST_K_OF_SET" : "EXACTLY_K_OF_SET",
            set: t.fixedSet,
            k: t.fixedK,
            label: t.label,
          };
          onPlacedRulesChange([...placedRules, newRule]);
          setSelectedTemplateIndex(null);
          return;
        }
        setPlacement({ kind: "set", templateIndex: selectedTemplateIndex, set: [stateId] });
      }
    },
    [level.availableRules, placement, placedRules, selectedTemplateIndex, onPlacedRulesChange]
  );

  const confirmSetPlacement = useCallback(() => {
    if (placement?.kind !== "set") return;
    const t = level.availableRules[placement.templateIndex] as RuleTemplate;
    const k = t.type === "AT_MOST_K" || t.type === "EXACTLY_K" ? (t.fixedK ?? placement.set.length) : 0;
    const newRule: PlacedRule = {
      id: nextId("r"),
      type: t.type === "AT_MOST_K" ? "AT_MOST_K_OF_SET" : "EXACTLY_K_OF_SET",
      set: placement.set,
      k,
      label: t.label,
    };
    onPlacedRulesChange([...placedRules, newRule]);
    setPlacement(null);
    setSelectedTemplateIndex(null);
  }, [level.availableRules, placement, placedRules, onPlacedRulesChange]);

  const handleSelectTemplate = useCallback(
    (index: number | null) => {
      if (index == null) {
        setSelectedTemplateIndex(null);
        setPlacement(null);
        return;
      }
      const t = level.availableRules[index] as RuleTemplate;
      const hasFixed =
        (t.type === "EXACTLY_K" || t.type === "AT_MOST_K") &&
        t.fixedSet != null &&
        t.fixedK != null;
      if (hasFixed) {
        const newRule: PlacedRule = {
          id: nextId("r"),
          type: t.type === "AT_MOST_K" ? "AT_MOST_K_OF_SET" : "EXACTLY_K_OF_SET",
          set: t.fixedSet!,
          k: t.fixedK!,
          label: t.label,
        };
        onPlacedRulesChange([...placedRules, newRule]);
        setSelectedTemplateIndex(null);
        return;
      }
      setSelectedTemplateIndex(index);
      setPlacement(null);
    },
    [level.availableRules, placedRules, onPlacedRulesChange]
  );

  const undo = useCallback(() => {
    if (placedRules.length) onPlacedRulesChange(placedRules.slice(0, -1));
  }, [placedRules, onPlacedRulesChange]);

  const reset = useCallback(() => {
    onPlacedRulesChange([]);
    setSelectedTemplateIndex(null);
    setPlacement(null);
  }, [onPlacedRulesChange]);

  const check = useCallback(() => {
    if (goalMet) {
      const rulesUsed = placedRules.length;
      const par = level.par;
      let stars = 3;
      if (rulesUsed > par + 2) stars = 1;
      else if (rulesUsed > par) stars = 2;
      onLevelComplete(stars, rulesUsed);
    }
  }, [goalMet, level.par, placedRules.length, onLevelComplete]);

  return (
    <div className="flex h-full flex-col">
      <GoalBar
        levelName={level.name}
        levelId={level.id}
        goal={level.goal}
        par={level.par}
        stars={completedStars}
        showPar={level.par > 0}
      />
      <div className="relative flex flex-1 flex-col">
        <div className="absolute left-2 top-2 flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="touch-target rounded border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--text)]"
          >
            Back
          </button>
          {level.hint && (
            <button
              type="button"
              className="touch-target rounded border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--muted)]"
              title={level.hint}
            >
              Hint
            </button>
          )}
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="relative h-[280px] w-full max-w-md">
            {level.states.map((stateId, i) => (
              <StateOrb
                key={stateId}
                label={stateId}
                status={getStatus(stateId)}
                index={i}
                total={level.states.length}
                selected={placement?.kind === "set" ? placement.set.includes(stateId) : false}
                onSelect={() => handleOrbSelect(stateId)}
              />
            ))}
          </div>
        </div>

        {placement?.kind === "set" && (
          <div className="flex justify-center gap-2 px-4 pb-2">
            <button
              type="button"
              onClick={confirmSetPlacement}
              className="rounded bg-[var(--possible)] px-4 py-2 text-sm font-medium text-[var(--bg)]"
            >
              Apply to {placement.set.length} orbs
            </button>
            <button
              type="button"
              onClick={() => setPlacement(null)}
              className="rounded border border-[var(--border)] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {placedRules.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 px-4 py-2">
            {placedRules.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onPlacedRulesChange(placedRules.filter((x) => x.id !== r.id))}
                className="rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--muted)] hover:border-red-500/50"
              >
                {r.label} ×
              </button>
            ))}
          </div>
        )}
        <RuleTray
          templates={level.availableRules}
          placedRules={placedRules}
          selectedTemplateIndex={selectedTemplateIndex}
          onSelectTemplate={handleSelectTemplate}
          unlimited={unlimited}
        />

        <div className="flex shrink-0 justify-center gap-3 border-t border-[var(--border)] bg-[var(--card)]/80 px-4 py-3">
          <button
            type="button"
            onClick={undo}
            disabled={placedRules.length === 0}
            className="touch-target rounded border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={reset}
            className="touch-target rounded border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={check}
            disabled={!goalMet}
            className="touch-target rounded bg-[var(--inevitable)] px-4 py-2 text-sm font-medium text-[var(--bg)] disabled:opacity-50"
          >
            Check
          </button>
        </div>
      </div>
    </div>
  );
}
