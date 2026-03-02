import type { Constraint, StateId } from "./types";

export type PackName =
  | "Crystal Lattice"
  | "Chain Reactor"
  | "Soft Flux"
  | "Mutual Exclusion Web"
  | "Parity Lock"
  | "Paradox Engine";

// Helper type to extract constraint without id, preserving discriminated union
type ConstraintWithoutId<T extends Constraint["kind"] = Constraint["kind"]> = 
  Extract<Constraint, { kind: T }> extends infer U
    ? U extends { id: string }
      ? Omit<U, "id">
      : never
    : never;

export type ConstraintPack = {
  name: PackName;
  description: string;
  build: (mk: <K extends Constraint["kind"]>(c: ConstraintWithoutId<K>) => Constraint, states: StateId[]) => Constraint[];
};

function pickSet(states: StateId[], ids: string[]): StateId[] {
  const valid = new Set(states);
  return ids.filter(x => valid.has(x as StateId)) as StateId[];
}

export const PACKS: ConstraintPack[] = [
  {
    name: "Crystal Lattice",
    description: "Pins a core set, then radiates inevitability through requirements. High structure, high inevitability.",
    build: (mk, states) => {
      const core = pickSet(states, ["A","B","C","D"]);
      const rest = pickSet(states, ["E","F","G","H","I","J","K","L"]);
      const out: Constraint[] = [];
      if (core.length >= 3) out.push(mk({ kind: "EXACTLY_K_OF_SET", set: core.slice(0, 3), k: 3 }));
      if (rest.length >= 4) out.push(mk({ kind: "AT_MOST_K_OF_SET", set: rest.slice(0, 4), k: 1 }));
      if (states.includes("A")) out.push(mk({ kind: "REQUIRES", a: "A", b: states.includes("E") ? "E" : core[0]! }));
      if (states.includes("B")) out.push(mk({ kind: "REQUIRES", a: "B", b: states.includes("F") ? "F" : core[0]! }));
      if (states.includes("C")) out.push(mk({ kind: "REQUIRES", a: "C", b: states.includes("G") ? "G" : core[0]! }));
      if (states.includes("H") && states.includes("I")) out.push(mk({ kind: "NOT_TOGETHER", a: "H", b: "I" }));
      return out;
    }
  },
  {
    name: "Chain Reactor",
    description: "A long implication chain that makes 'Why' explanations pop. Great for demos and teaching.",
    build: (mk, states) => {
      const s = states;
      const out: Constraint[] = [];
      if (s.length >= 2) out.push(mk({ kind: "EXACTLY_K_OF_SET", set: [s[0]!, s[1]!], k: 2 })); // pins first two
      for (let i = 0; i < Math.min(6, s.length - 1); i++) {
        out.push(mk({ kind: "REQUIRES", a: s[i]!, b: s[i + 1]! }));
      }
      return out;
    }
  },
  {
    name: "Soft Flux",
    description: "Keeps many states possible while adding gentle contour. Low inevitability, high play.",
    build: (mk, states) => {
      const out: Constraint[] = [];
      if (states.length >= 2) out.push(mk({ kind: "NOT_TOGETHER", a: states[0]!, b: states[1]! }));
      if (states.length >= 5) out.push(mk({ kind: "AT_MOST_K_OF_SET", set: states.slice(2, 6), k: 3 }));
      if (states.length >= 8) out.push(mk({ kind: "AT_MOST_K_OF_SET", set: states.slice(6, 10), k: 2 }));
      return out;
    }
  },
  {
    name: "Mutual Exclusion Web",
    description: "A web of NOT_TOGETHER edges that carves the space. Great for graph structure.",
    build: (mk, states) => {
      const out: Constraint[] = [];
      const s = states.slice(0, Math.min(10, states.length));
      for (let i = 0; i < s.length; i += 2) {
        if (i + 1 < s.length) out.push(mk({ kind: "NOT_TOGETHER", a: s[i]!, b: s[i + 1]! }));
        if (i + 2 < s.length) out.push(mk({ kind: "NOT_TOGETHER", a: s[i]!, b: s[i + 2]! }));
      }
      return out;
    }
  },
  {
    name: "Parity Lock",
    description: "Set rules that force exact counts. Dramatic flips between possible/inevitable/impossible.",
    build: (mk, states) => {
      const out: Constraint[] = [];
      if (states.length >= 4) out.push(mk({ kind: "EXACTLY_K_OF_SET", set: states.slice(0, 4), k: 2 }));
      if (states.length >= 8) out.push(mk({ kind: "EXACTLY_K_OF_SET", set: states.slice(4, 8), k: 3 }));
      if (states.length >= 10) out.push(mk({ kind: "AT_MOST_K_OF_SET", set: states.slice(8, 12), k: 1 }));
      return out;
    }
  },
  {
    name: "Paradox Engine",
    description: "Intentionally contradictory. Triggers the contradiction banner + auto-normalize behavior.",
    build: (mk, states) => {
      const out: Constraint[] = [];
      if (states.length < 2) return out;
      const a = states[0]!;
      const b = states[1]!;
      out.push(mk({ kind: "EXACTLY_K_OF_SET", set: [a], k: 1 }));
      out.push(mk({ kind: "REQUIRES", a, b }));
      out.push(mk({ kind: "NOT_TOGETHER", a, b }));
      return out;
    }
  }
];


