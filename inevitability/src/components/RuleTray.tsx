import type { PlacedRule, RuleTemplate } from "../game/types";
import { RuleTile } from "./RuleTile";

type Props = {
  templates: RuleTemplate[];
  placedRules: PlacedRule[];
  selectedTemplateIndex: number | null;
  onSelectTemplate: (index: number | null) => void;
  unlimited?: boolean;
};

function ruleMatchesTemplate(p: PlacedRule, t: RuleTemplate): boolean {
  if (t.type === "NOT_TOGETHER") return p.type === "NOT_TOGETHER";
  if (t.type === "REQUIRES") return p.type === "REQUIRES";
  if (t.type === "AT_MOST_K")
    return p.type === "AT_MOST_K_OF_SET" && p.k === (t as { fixedK?: number }).fixedK;
  if (t.type === "EXACTLY_K") {
    if (p.type !== "EXACTLY_K_OF_SET") return false;
    const tk = (t as { fixedSet?: string[]; fixedK?: number });
    if (tk.fixedSet != null && tk.fixedK != null)
      return p.k === tk.fixedK && JSON.stringify(p.set?.slice().sort()) === JSON.stringify(tk.fixedSet.slice().sort());
    return p.k === tk.fixedK;
  }
  return false;
}

function countUsed(template: RuleTemplate, placed: PlacedRule[]): number {
  return placed.filter((p) => ruleMatchesTemplate(p, template)).length;
}

export function RuleTray({
  templates,
  placedRules,
  selectedTemplateIndex,
  onSelectTemplate,
  unlimited,
}: Props) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-[var(--border)] bg-[var(--card)]/90 px-4 py-3 backdrop-blur">
      {templates.map((t, i) => {
        const used = countUsed(t, placedRules);
        const total = unlimited ? Infinity : templates.filter((x) => sameTemplate(x, t)).length;
        const remaining = total === Infinity ? -1 : Math.max(0, total - used);
        const disabled = !unlimited && remaining <= 0;
        const isSelected = selectedTemplateIndex === i;

        return (
          <RuleTile
            key={`${t.type}-${t.label}-${i}`}
            label={t.label}
            disabled={disabled}
            remaining={remaining}
            onClick={() => onSelectTemplate(isSelected ? null : i)}
            isPlaced={false}
          />
        );
      })}
    </div>
  );
}

function sameTemplate(a: RuleTemplate, b: RuleTemplate): boolean {
  if (a.type !== b.type) return false;
  if (a.label !== b.label) return false;
  if (a.type === "NOT_TOGETHER" && b.type === "NOT_TOGETHER")
    return a.fixedA === b.fixedA && a.fixedB === b.fixedB;
  if (a.type === "REQUIRES" && b.type === "REQUIRES")
    return a.fixedA === b.fixedA && a.fixedB === b.fixedB;
  if (a.type === "AT_MOST_K" && b.type === "AT_MOST_K")
    return a.fixedK === b.fixedK && JSON.stringify(a.fixedSet) === JSON.stringify(b.fixedSet);
  if (a.type === "EXACTLY_K" && b.type === "EXACTLY_K")
    return a.fixedK === b.fixedK && JSON.stringify(a.fixedSet) === JSON.stringify(b.fixedSet);
  return false;
}
