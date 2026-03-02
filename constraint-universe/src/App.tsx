import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Constraint, StateId, Universe, UniverseId, ConstraintFrame } from "./domain/types";
import { analyzeUniverse, normalizeConstraintsGreedy } from "./domain/engine";
import { SOLVERS } from "./domain/solvers";
import type { SolverId } from "./domain/solver";
import { uid, unique } from "./domain/util";
import { PACKS, type PackName } from "./domain/packs";
import * as htmlToImage from "html-to-image";
import { verifySatMatchesBrute } from "./domain/verify";
import { runTemporalQuery } from "./domain/solverSat";
import { estimateProbabilities, estimateBoltzmannProbabilities } from "./domain/sampling";
import { approxCountWithCI, approxProbLitWithCI } from "./domain/approxCount";
import { getOrCompileCnf } from "./domain/cnfCache";

const ALPHABET = "ABCDEFGHIJKLMNOP";
function makeStates(n: number): StateId[] {
  return ALPHABET.slice(0, Math.max(6, Math.min(16, n))).split("") as StateId[];
}

type DraftKind = Constraint["kind"];

function badge(status: "POSSIBLE" | "IMPOSSIBLE" | "INEVITABLE") {
  switch (status) {
    case "INEVITABLE": return "INEVITABLE";
    case "IMPOSSIBLE": return "IMPOSSIBLE";
    case "POSSIBLE": return "POSSIBLE";
  }
}

export default function App() {
  const [scale, setScale] = useState<number>(10);
  const [horizon, setHorizon] = useState<number>(0);
  const states = useMemo(() => makeStates(scale), [scale]);

  const [constraintsByU, setConstraintsByU] = useState<Record<UniverseId, Constraint[]>>(() => {
    // Universe A: keep existing localStorage behavior
    const loadA = (): Constraint[] => {
      try {
        const raw = localStorage.getItem("cu_constraints_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed as Constraint[];
        }
      } catch {}
      return [
        { id: uid(), kind: "NOT_TOGETHER", a: "A", b: "B" },
        { id: uid(), kind: "REQUIRES", a: "C", b: "D" },
        { id: uid(), kind: "AT_MOST_K_OF_SET", set: ["E","F","G"], k: 1 }
      ];
    };

    // Universe B: starts empty
    return { A: loadA(), B: [] };
  });

  const [framesByU, setFramesByU] = useState<Record<UniverseId, ConstraintFrame[]>>(() => {
    try {
      const raw = localStorage.getItem("cu_frames_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return { A: parsed as ConstraintFrame[], B: [{ t: 0, constraints: [], label: "t0" }] };
        }
      }
    } catch {}
    return {
      A: [{ t: 0, constraints: constraintsByU.A, label: "t0" }],
      B: [{ t: 0, constraints: constraintsByU.B, label: "t0" }]
    };
  });

  const [tIndexByU, setTIndexByU] = useState<Record<UniverseId, number>>({ A: 0, B: 0 });

  const [activeU, setActiveU] = useState<UniverseId>("A");
  const [compare, setCompare] = useState<boolean>(false);
  const [solverId, setSolverId] = useState<SolverId>("BRUTE_FORCE");
  const [tInspect, setTInspect] = useState<number>(0);
  const [qState, setQState] = useState<string>("A");
  const [qTime, setQTime] = useState<number>(0);
  const [qWant, setQWant] = useState<"TRUE" | "FALSE">("TRUE");
  const [qResult, setQResult] = useState<any>(null);
  const [qMode, setQMode] = useState<"STATE" | "REACH_EXACT" | "EVENTUALLY" | "ALWAYS">("STATE");
  const [qTarget, setQTarget] = useState<string>("B,C");
  const [wMissing, setWMissing] = useState<number>(2);
  const [wExtra, setWExtra] = useState<number>(1);
  const [probT, setProbT] = useState<number>(0);
  const [probN, setProbN] = useState<number>(80);
  const [probMaxTries, setProbMaxTries] = useState<number>(400);
  const [probBusy, setProbBusy] = useState<boolean>(false);
  const [probStats, setProbStats] = useState<any>(null);
  const [thermoMode, setThermoMode] = useState<"UNIFORM" | "BOLTZMANN" | "COUNT_CI">("UNIFORM");
  const [tempT, setTempT] = useState<number>(1.0);
  const [tempTarget, setTempTarget] = useState<string>(""); // comma list; empty => target = {}
  const [tempWMiss, setTempWMiss] = useState<number>(2);
  const [tempWExtra, setTempWExtra] = useState<number>(1);
  const [tempStats, setTempStats] = useState<any>(null);
  const [ciTrials, setCiTrials] = useState<number>(30);
  const [ciBusy, setCiBusy] = useState<boolean>(false);
  const [ciStats, setCiStats] = useState<any>(null);

  const solver = useMemo(() => SOLVERS.find(s => s.id === solverId) ?? SOLVERS[0]!, [solverId]);

  function isSatSolver(id: SolverId) {
    const s = SOLVERS.find(x => x.id === id);
    return !!s && /sat/i.test(s.name);
  }

  const frames = framesByU[activeU];
  const tIndex = tIndexByU[activeU] ?? 0;

  function setTIndex(next: number) {
    setTIndexByU(prev => ({ ...prev, [activeU]: Math.max(0, Math.min(framesByU[activeU].length - 1, next)) }));
  }

  function setFramesFor(u: UniverseId, next: ConstraintFrame[]) {
    setFramesByU(prev => ({ ...prev, [u]: next }));
  }

  function currentFrameConstraints(u: UniverseId): Constraint[] {
    const fr = framesByU[u];
    const idx = tIndexByU[u] ?? 0;
    return fr[Math.max(0, Math.min(fr.length - 1, idx))]?.constraints ?? [];
  }

  const constraints = currentFrameConstraints(activeU);

  function setConstraintsFor(u: UniverseId, next: Constraint[]) {
    // keep quick-access store
    setConstraintsByU(prev => ({ ...prev, [u]: next }));

    // write into current frame
    setFramesByU(prev => {
      const fr = prev[u];
      const idx = tIndexByU[u] ?? 0;
      const nextFrames = fr.map((f, i) => (i === idx ? { ...f, constraints: next } : f));
      return { ...prev, [u]: nextFrames };
    });
  }

  function newFrame(label?: string) {
    setFramesByU(prev => {
      const fr = prev[activeU];
      const nextT = fr.length ? fr[fr.length - 1]!.t + 1 : 0;
      const frame: ConstraintFrame = { t: nextT, constraints: [], label: label ?? `t${nextT}` };
      return { ...prev, [activeU]: [...fr, frame] };
    });
    setTIndexByU(prev => ({ ...prev, [activeU]: framesByU[activeU].length })); // jump to new
    pushLog("time: new frame");
  }

  function duplicateFrame() {
    const fr = framesByU[activeU];
    const idx = tIndexByU[activeU] ?? 0;
    const cur = fr[idx] ?? { t: 0, constraints: [] };
    const nextT = fr.length ? fr[fr.length - 1]!.t + 1 : 0;
    const frame: ConstraintFrame = { t: nextT, constraints: cur.constraints, label: `t${nextT} (copy)` };
    setFramesFor(activeU, [...fr, frame]);
    setTIndexByU(prev => ({ ...prev, [activeU]: fr.length }));
    pushLog("time: duplicate frame");
  }

  const [lastNormalize, setLastNormalize] = useState<{ removed: number } | null>(null);
  const [view, setView] = useState<"LIST" | "GRAPH">("LIST");
  const [mode, setMode] = useState<"EXPLORATION" | "STUDY">("EXPLORATION");
  const [demo, setDemo] = useState<boolean>(false);
  const [stage, setStage] = useState<boolean>(false);
  const [ioText, setIoText] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const [script, setScript] = useState<string>("");
  const [packName, setPackName] = useState<PackName>("Crystal Lattice");
  const [seed, setSeed] = useState<string>(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("seed") ?? "";
  });
  const [embed] = useState<boolean>(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("embed") === "1";
  });
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try { return localStorage.getItem("cu_tutorial_dismissed") !== "1"; } catch { return true; }
  });
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [openProof, setOpenProof] = useState<Record<string, boolean>>({});
  const [verified, setVerified] = useState<boolean | null>(null);

  function toggleProof(key: string) {
    setOpenProof(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const undoRef = useRef<Record<UniverseId, Constraint[][]>>({ A: [], B: [] });
  const redoRef = useRef<Record<UniverseId, Constraint[][]>>({ A: [], B: [] });
  const applyingRef = useRef<boolean>(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const didInitRef = useRef<boolean>(false);

  const [snapshots, setSnapshots] = useState<Array<{ id: string; label: string; data: Constraint[] }>>([]);

  function pushLog(msg: string) {
    setLog(prev => [msg, ...prev].slice(0, 8));
  }

  function runQuery() {
    const u: Universe = { states, constraints, horizon };

    const t = qTime;
    if (qMode === "STATE") {
      const res = runTemporalQuery(u, { kind: "STATE", state: qState as any, want: qWant, t });
      setQResult(res);
      pushLog(`query: ${qState}@${t} is ${qWant === "TRUE" ? "true" : "false"}`);
      return;
    }

    const target = qTarget
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => states.includes(s as any)) as any;

    const res = runTemporalQuery(u, { kind: "REACH_EXACT", target, t, wMissing, wExtra });
    setQResult(res);
    pushLog(`reach@${t}: {${target.join(",")}}`);
    return;
  }

  if (qMode === "EVENTUALLY") {
    const u: Universe = { states, constraints, horizon };
    const res = runTemporalQuery(u, { kind: "EVENTUALLY", state: qState as any });
    setQResult(res);
    pushLog(`eventually: ${qState} within T=${horizon}`);
    return;
  }

  if (qMode === "ALWAYS") {
    const u: Universe = { states, constraints, horizon };
    const res = runTemporalQuery(u, { kind: "ALWAYS", state: qState as any });
    setQResult(res);
    pushLog(`always: ${qState} within T=${horizon}`);
    return;
  }

  async function runProbabilityEstimate() {
    if (!isSatSolver(solverId)) return;
    setProbBusy(true);
    try {
      const u: Universe = { states, constraints, horizon };
      const stats = await estimateProbabilities(u, probT, probN, probMaxTries);
      setProbStats(stats);
      setTempStats(null); // keep displays separate
      pushLog(`thermo: sampled ${stats.samples}@t=${probT}`);
    } finally {
      setProbBusy(false);
    }
  }

  async function runTemperatureEstimate() {
    if (!isSatSolver(solverId)) return;

    setProbBusy(true);
    try {
      const u: Universe = { states, constraints, horizon };

      const tgt = tempTarget
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .filter(s => states.includes(s as any)) as any;

      const stats = await estimateBoltzmannProbabilities(
        u,
        probT,
        probN,
        probMaxTries,
        tempT,
        tgt,
        tempWMiss,
        tempWExtra
      );

      setTempStats(stats);
      setProbStats(null); // keep displays separate
      pushLog(`temp: T=${tempT.toFixed(2)} @t=${probT} samples=${stats.samples}`);
    } finally {
      setProbBusy(false);
    }
  }

  async function runCountCI() {
    if (!isSatSolver(solverId)) return;
    setCiBusy(true);
    try {
      const u: Universe = { states, constraints, horizon };
      const { comp } = getOrCompileCnf(u);
      const base = comp.enableAllAssumptions;

      const total = approxCountWithCI(comp, base, { trials: ciTrials });

      const probs: any = {};
      for (const s of states) {
        const v = comp.varOfStateAt(s, probT);
        const r = approxProbLitWithCI(comp, base, v, { trials: ciTrials });
        probs[s] = r.p;
        await new Promise(r => setTimeout(r, 0));
      }

      setCiStats({ t: probT, trials: ciTrials, total, probs });
      pushLog(`countCI: t=${probT} trials=${ciTrials}`);
    } finally {
      setCiBusy(false);
    }
  }

  function addSnapshot(label: string, data: Constraint[]) {
    setSnapshots(prev => [{ id: uid("s"), label, data }, ...prev].slice(0, 12));
  }

  function setConstraintsWithHistory(next: Constraint[], label?: string) {
    if (!applyingRef.current) {
      undoRef.current[activeU].unshift(constraintsByU[activeU]);
      undoRef.current[activeU] = undoRef.current[activeU].slice(0, 50);
      redoRef.current[activeU] = [];
      if (label) {
        pushLog(label);
        addSnapshot(label, next);
      }
    }
    setConstraintsFor(activeU, next);
  }

  function undo() {
    const prev = undoRef.current[activeU].shift();
    if (!prev) return;
    redoRef.current[activeU].unshift(constraintsByU[activeU]);
    applyingRef.current = true;
    setConstraintsFor(activeU, prev);
    applyingRef.current = false;
    pushLog("undo");
  }

  function redo() {
    const nxt = redoRef.current[activeU].shift();
    if (!nxt) return;
    undoRef.current[activeU].unshift(constraintsByU[activeU]);
    applyingRef.current = true;
    setConstraintsFor(activeU, nxt);
    applyingRef.current = false;
    pushLog("redo");
  }

  function jumpToSnapshot(s: { id: string; label: string; data: Constraint[] }) {
    setConstraintsWithHistory(s.data, `jump: ${s.label}`);
  }

  function hash32(str: string): number {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed: number) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)]!;
  }

  function normalizeSeedKey(x: string) {
    return (x || "").trim().toLowerCase().replace(/\s+/g, "-");
  }

  function tryLoadCuratedSeed(seedValue: string): boolean {
    const key = normalizeSeedKey(seedValue);
    if (!key) return false;

    // Curated mapping:
    const curated: Record<string, { kind: "PACK"; name: PackName } | { kind: "PRESET"; name: "CRYSTAL" | "CHAOS" | "CHAIN" | "PARADOX" } | { kind: "TEMPORAL_DEMO" }> = {
      "crystal-lattice": { kind: "PACK", name: "Crystal Lattice" },
      "chain-reactor": { kind: "PACK", name: "Chain Reactor" },
      "paradox-engine": { kind: "PACK", name: "Paradox Engine" },

      // Optional: map to older presets if you prefer them (keep as examples)
      "crystal": { kind: "PRESET", name: "CRYSTAL" },
      "chain": { kind: "PRESET", name: "CHAIN" },
      "paradox": { kind: "PRESET", name: "PARADOX" },

      // Special: temporal demo sets horizon and a few temporal constraints
      "temporal-demo": { kind: "TEMPORAL_DEMO" }
    };

    const hit = curated[key];
    if (!hit) return false;

    try {
      if (hit.kind === "PACK") {
        // Load the pack exactly
        const pack = PACKS.find(p => p.name === hit.name);
        if (!pack) return false;
        const mk = (c: Omit<Constraint, "id">): Constraint => ({ id: uid(), ...c } as Constraint);
        const built = pack.build(mk, states);
        setConstraintsWithHistory(built, `pack: ${pack.name.toLowerCase()}`);
        pushLog(`loaded: seed(${key}) -> pack`);
        return true;
      }
      if (hit.kind === "PRESET") {
        loadPreset(hit.name);
        pushLog(`loaded: seed(${key}) -> preset`);
        return true;
      }
      if (hit.kind === "TEMPORAL_DEMO") {
        // Minimal deterministic temporal setup:
        // - ensure SAT solver
        // - set horizon
        // - add a small set of constraints
        const sat = SOLVERS.find(s => s.id !== "BRUTE_FORCE" && /sat/i.test(s.name));
        if (sat) setSolverId(sat.id);
        setHorizon(4);

        // Put us in a clean presentation configuration
        setDemo(true);
        setStage(false);

        // Deterministic constraints (ensure states exist)
        const mk = (c: Omit<Constraint, "id">): Constraint => ({ id: uid(), ...c } as Constraint);
        const base: Constraint[] = [];
        
        if (states.length >= 1 && states.includes("A")) {
          base.push(mk({ kind: "EXACTLY_K_OF_SET", set: ["A"], k: 1 } as Omit<Constraint, "id">));
          base.push(mk({ kind: "PERSIST", s: "A" } as Omit<Constraint, "id">));
        }
        if (states.length >= 2 && states.includes("A") && states.includes("B")) {
          base.push(mk({ kind: "NEXT_REQUIRES", a: "A", b: "B" } as Omit<Constraint, "id">));
        }
        if (states.length >= 3 && states.includes("B") && states.includes("C")) {
          base.push(mk({ kind: "NEXT_REQUIRES", a: "B", b: "C" } as Omit<Constraint, "id">));
        }

        if (base.length > 0) {
          setConstraintsWithHistory(base, `seed:${key}`);
          pushLog(`loaded: seed(${key}) -> temporal demo`);
          return true;
        }
        return false;
      }
    } catch {
      // If something fails due to name mismatch, fall through to random.
      return false;
    }

    return false;
  }

  function randomizeFromSeed(seedOverride?: string) {
    const s = (seedOverride ?? seed ?? "").trim();
    const used = s.length ? s : `seed-${Math.random().toString(16).slice(2, 8)}`;
    setSeed(used);

    // Keep URL in sync but do NOT stomp hash if one exists (your priority resolver already handles hash)
    const url = new URL(window.location.href);
    url.searchParams.set("seed", used);
    window.history.replaceState(null, "", url.toString());

    const rng = mulberry32(hash32(used));
    const mk = (c: Omit<Constraint, "id">): Constraint => ({ id: uid(), ...c } as Constraint);

    // Choose 6–10 constraints depending on scale
    const count = Math.max(6, Math.min(10, Math.floor(states.length / 2) + 2));
    const next: Constraint[] = [];

    const letters = [...states];

    // Ensure at least one set rule for structure
    const setSize = Math.max(2, Math.min(5, 2 + Math.floor(rng() * 4)));
    const set = Array.from({ length: setSize }, () => pick(rng, letters));
    const uniqueSet = Array.from(new Set(set));
    const k = Math.max(0, Math.min(uniqueSet.length, 1 + Math.floor(rng() * uniqueSet.length)));

    next.push(mk({ kind: rng() < 0.5 ? "AT_MOST_K_OF_SET" : "EXACTLY_K_OF_SET", set: uniqueSet, k } as Omit<Constraint, "id">));

    for (let i = next.length; i < count; i++) {
      const r = rng();
      if (r < 0.45) {
        // REQUIRES
        let a = pick(rng, letters), b = pick(rng, letters);
        if (a === b) b = pick(rng, letters);
        next.push(mk({ kind: "REQUIRES", a, b } as Omit<Constraint, "id">));
      } else if (r < 0.85) {
        // NOT_TOGETHER
        let a = pick(rng, letters), b = pick(rng, letters);
        if (a === b) b = pick(rng, letters);
        next.push(mk({ kind: "NOT_TOGETHER", a, b } as Omit<Constraint, "id">));
      } else {
        // Another set rule
        const ss = Math.max(2, Math.min(6, 2 + Math.floor(rng() * 5)));
        const sset = Array.from({ length: ss }, () => pick(rng, letters));
        const u = Array.from(new Set(sset));
        const kk = Math.max(0, Math.min(u.length, Math.floor(rng() * (u.length + 1))));
        next.push(mk({ kind: "AT_MOST_K_OF_SET", set: u, k: kk } as Omit<Constraint, "id">));
      }
    }

    setConstraintsWithHistory(next, `randomized: ${used}`);
  }

  function universeName(): string {
    const n = states.length;
    const c = constraints.length;
    const inev = analysis.inevitable.size;
    const poss = analysis.possible.size;
    const tensionTop = analysis.tension?.[0]?.delta ?? 0;

    const density =
      c === 0 ? "Vacuum" :
      c < 4 ? "Sparse" :
      c < 8 ? "Tight" :
      "Crystalline";

    const regime =
      analysis.witnessWorld === null ? "Paradox" :
      inev >= Math.ceil(n * 0.6) ? "Determinism" :
      poss >= Math.ceil(n * 0.9) ? "Flux" :
      "Contour";

    const force =
      tensionTop > (1 << Math.min(n, 16)) * 0.2 ? "High-Tension" :
      tensionTop > (1 << Math.min(n, 16)) * 0.05 ? "Tension" :
      "Low-Tension";

    return `${density} ${force} ${regime}`;
  }

  async function copyScript() {
    try { await navigator.clipboard.writeText(script); } catch {}
  }

  function generateScript(): string {
    const name = universeName();
    const n = states.length;
    const c = constraints.length;

    const inevList = Array.from(analysis.inevitable).sort().slice(0, 8);
    const whyExample = inevList
      .map(s => ({ s, r: analysis.reasons?.get(s) }))
      .find(x => x.r && x.r.kind === "REQUIRES_CHAIN");

    const topT = analysis.tension?.[0];

    const lines: string[] = [];
    lines.push(`Universe: ${name}`);
    lines.push(`Scale: ${n} states, ${c} constraints, ${analysis.perf ? analysis.perf.worlds.toLocaleString() : "?"} worlds.`);
    lines.push(`Rule: I only change constraints. The universe reconfigures itself.`);
    lines.push(`Inevitable: ${inevList.length ? inevList.join(" ") : "none (yet)"}.`);

    if (topT) lines.push(`Strongest shaper: ${topT.label} (removes Δ ${topT.delta.toLocaleString()} worlds).`);

    if (whyExample && whyExample.r && whyExample.r.kind === "REQUIRES_CHAIN") {
      lines.push(`Why example: ${whyExample.s} becomes inevitable via ${whyExample.r.chain.join(" → ")}.`);
    } else {
      const anyInev = inevList[0];
      if (anyInev) lines.push(`Why: check the Graph + "Why" tags to see which rules pin inevitability.`);
      else lines.push(`Next: add one REQUIRES chain or an EXACTLY_K set rule to create inevitability.`);
    }

    lines.push(`Next move: add a single constraint and watch the shaping score and tension ranking change.`);
    return lines.join("\n");
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  }

  function dismissTutorial() {
    try { localStorage.setItem("cu_tutorial_dismissed", "1"); } catch {}
    setShowTutorial(false);
  }

  function toggleHelp() {
    setShowHelp(prev => !prev);
  }

  function b64Encode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64Decode(str: string): string {
    return decodeURIComponent(escape(atob(str)));
  }

  function setHashFromConstraints(nextConstraints: Constraint[]) {
    const payload = JSON.stringify({ constraints: nextConstraints });
    const encoded = b64Encode(payload);
    window.location.hash = encoded;
  }

  function importFromHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return false;
    try {
      const decoded = b64Decode(hash);
      const parsed = JSON.parse(decoded);
      if (!parsed || !Array.isArray(parsed.constraints)) return false;

      const valid = new Set(states);
      const filtered = parsed.constraints.filter((c: any) => {
        if (!c || typeof c.id !== "string" || typeof c.kind !== "string") return false;
        if (c.kind === "NOT_TOGETHER" || c.kind === "REQUIRES") return valid.has(c.a) && valid.has(c.b);
        if (c.kind === "AT_MOST_K_OF_SET" || c.kind === "EXACTLY_K_OF_SET") return Array.isArray(c.set) && c.set.every((x: any) => valid.has(x));
        return false;
      });

      setConstraintsWithHistory(filtered, "imported scenario");
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const p = new URLSearchParams(window.location.search);

    // Read params
    const embedParam = p.get("embed") === "1";
    const demoParam = p.get("demo");
    const stageParam = p.get("stage");

    // Apply embed FIRST (embed wins over demo/stage params)
    if (embedParam) {
      setCompare(false);
      setDemo(true);
      setMode("STUDY");
      setView("GRAPH");
      // stage: in embed mode, default OFF unless explicitly allowed
      setStage(false);
    } else {
      // Only apply demo/stage params when NOT embed
      if (demoParam === "1") setDemo(true);
      if (stageParam === "1") setStage(true);
    }

    // Priority 1: hash scenario wins
    const didHash = importFromHash();
    if (didHash) {
      pushLog("loaded: hash");
      return;
    }

    // Priority 2: seed scenario
    const seedFromUrl = p.get("seed");
    if (seedFromUrl) {
      const usedCurated = tryLoadCuratedSeed(seedFromUrl);
      if (!usedCurated) {
        randomizeFromSeed(seedFromUrl);
        pushLog("loaded: seed");
      }
      return;
    }

    // Priority 3: memory already hydrated by frames/localStorage initializers
    pushLog("loaded: memory");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    addSnapshot("start", constraints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "STUDY") setView("GRAPH");
  }, [mode]);

  useEffect(() => {
    if (demo) {
      setMode("STUDY");
      setView("GRAPH");
    }
  }, [demo]);

  useEffect(() => {
    if (embed) {
      setDemo(true);
      setMode("STUDY");
      setView("GRAPH");
      setCompare(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed]);

  useEffect(() => {
    document.title = `Constraint Universe — ${universeName()}`;
  });

  useEffect(() => {
    setTInspect((t) => Math.max(0, Math.min(horizon, t)));
  }, [horizon]);

  useEffect(() => {
    setQTime((t) => Math.max(0, Math.min(horizon, t)));
  }, [horizon]);

  useEffect(() => {
    if (!states.includes(qState as any)) setQState(states[0] as any);
  }, [states]); // eslint-disable-line

  useEffect(() => {
    setQTime((t) => Math.max(0, Math.min(horizon, t)));
  }, [horizon]);

  useEffect(() => {
    if (!states.includes(qState as any)) setQState(states[0] as any);
  }, [states]); // eslint-disable-line

  useEffect(() => {
    setProbT((x) => Math.max(0, Math.min(horizon, x)));
  }, [horizon]);

  useEffect(() => {
    // only verify when SAT selected
    if (!isSatSolver(solverId)) { setVerified(null); return; }
    if (states.length > 12) { setVerified(null); return; }

    const temporal = horizon > 0 || constraints.some(c => c.kind === "NEXT_REQUIRES");
    if (temporal) { setVerified(null); return; }

    const u: Universe = { states, constraints };
    const v = verifySatMatchesBrute(u);
    setVerified(v.ok ? true : false);
  }, [solverId, states, constraints, horizon]);

  useEffect(() => {
    const hasTemporal =
      horizon > 0 ||
      constraints.some(c => c.kind === "NEXT_REQUIRES" || c.kind === "PERSIST");

    if (!hasTemporal) return;

    // If we're not already on a SAT solver, switch to the first SAT solver available.
    if (!isSatSolver(solverId)) {
      const sat = SOLVERS.find(s => /sat/i.test(s.name));
      if (sat) setSolverId(sat.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon, constraints, solverId]);

  useEffect(() => {
    const valid = new Set(states);
    const filter = (arr: Constraint[]) => arr.filter((c: any) => {
      if (c.kind === "NOT_TOGETHER" || c.kind === "REQUIRES") return valid.has(c.a) && valid.has(c.b);
      if (c.kind === "AT_MOST_K_OF_SET" || c.kind === "EXACTLY_K_OF_SET") return Array.isArray(c.set) && c.set.every((x: any) => valid.has(x));
      return false;
    });

    const filterFrames = (frames: ConstraintFrame[]) =>
      frames.map(f => ({ ...f, constraints: filter(f.constraints) }));

    setFramesByU(prev => ({
      A: filterFrames(prev.A),
      B: filterFrames(prev.B)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states]);


  useEffect(() => {
    try { localStorage.setItem("cu_frames_v1", JSON.stringify(framesByU.A)); } catch {}
  }, [framesByU.A]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constraints]);

  const universeA: Universe = { states, constraints: currentFrameConstraints("A"), horizon };
  const universeB: Universe = { states, constraints: currentFrameConstraints("B"), horizon };

  const analysisA = useMemo(() => solver.analyze(universeA), [solver, states, framesByU.A, tIndexByU.A, horizon]);
  const analysisB = useMemo(() => solver.analyze(universeB), [solver, states, framesByU.B, tIndexByU.B, horizon]);

  const analysis = activeU === "A" ? analysisA : analysisB;

  // Draft constraint builder
  const [kind, setKind] = useState<DraftKind>("NOT_TOGETHER");
  const [a, setA] = useState<StateId>("A");
  const [b, setB] = useState<StateId>("B");
  const [setList, setSetList] = useState<string>("E,F,G");
  const [k, setK] = useState<number>(1);

  function addConstraint() {
    const id = uid();
    let next: Constraint | null = null;

    if (kind === "NOT_TOGETHER") {
      if (a === b) return;
      next = { id, kind, a, b };
    } else if (kind === "REQUIRES") {
      if (a === b) return;
      next = { id, kind, a, b };
    } else if (kind === "NEXT_REQUIRES") {
      if (a === b) return;
      next = { id, kind, a, b };
    } else if (kind === "PERSIST") {
      next = { id, kind, s: a };
    } else if (kind === "AT_MOST_K_OF_SET" || kind === "EXACTLY_K_OF_SET") {
      const set = unique(
        setList
          .split(",")
          .map(s => s.trim().toUpperCase())
          .filter(Boolean)
          .filter(s => states.includes(s as StateId)) as StateId[]
      );
      const kk = Math.max(0, Math.min(10, Number.isFinite(k) ? k : 0));
      if (set.length === 0) return;

      next = kind === "AT_MOST_K_OF_SET"
        ? { id, kind: "AT_MOST_K_OF_SET", set, k: kk }
        : { id, kind: "EXACTLY_K_OF_SET", set, k: kk };
    }

    if (!next) return;
    setConstraintsWithHistory([next!, ...constraints], `+ ${kind}`);
  }

  function removeConstraint(id: string) {
    setConstraintsWithHistory(constraints.filter(c => c.id !== id), "- constraint");
  }

  function reset() {
    setConstraintsWithHistory([], "cleared constraints");
    setLastNormalize(null);
  }

  function normalize() {
    const { kept, removed } = normalizeConstraintsGreedy({ states, constraints });
    setConstraintsWithHistory(kept, `auto-normalize removed ${removed.length}`);
    setLastNormalize({ removed: removed.length });
  }

  async function copyShareUrl() {
    // Ensure hash reflects current active universe/frame before copying
    setHashFromConstraints(constraints);
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); } catch {}
    pushLog("copied: share url");
  }

  function printView() {
    pushLog("print/save");
    window.print();
  }

  async function exportPng() {
    try {
      if (!rootRef.current) return;
      pushLog("export png");
      const dataUrl = await htmlToImage.toPng(rootRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `constraint-universe-${universeName().toLowerCase().replaceAll(" ","-")}.png`;
      a.click();
    } catch {
      // ignore
    }
  }

  function loadPreset(name: "CRYSTAL" | "CHAOS" | "CHAIN" | "PARADOX") {
    const mk = (c: Omit<Constraint, "id">): Constraint => ({ id: uid(), ...c } as Constraint);

    const presets: Record<typeof name, Constraint[]> = {
      // Dense constraints → rigid, inevitable structures
      CRYSTAL: [
        mk({ kind: "EXACTLY_K_OF_SET", set: ["A","B","C"], k: 3 } as Omit<Constraint, "id">), // pins A,B,C
        mk({ kind: "REQUIRES", a: "A", b: "D" } as Omit<Constraint, "id">),
        mk({ kind: "REQUIRES", a: "B", b: "E" } as Omit<Constraint, "id">),
        mk({ kind: "REQUIRES", a: "C", b: "F" } as Omit<Constraint, "id">),
        mk({ kind: "NOT_TOGETHER", a: "G", b: "H" } as Omit<Constraint, "id">),
        mk({ kind: "AT_MOST_K_OF_SET", set: ["G","H","I","J"], k: 1 } as Omit<Constraint, "id">)
      ],

      // Light constraints → lots possible, little inevitable
      CHAOS: [
        mk({ kind: "NOT_TOGETHER", a: "A", b: "B" } as Omit<Constraint, "id">),
        mk({ kind: "AT_MOST_K_OF_SET", set: ["C","D","E"], k: 2 } as Omit<Constraint, "id">)
      ],

      // A long chain → inevitability via implication
      CHAIN: [
        mk({ kind: "EXACTLY_K_OF_SET", set: ["A","B"], k: 2 } as Omit<Constraint, "id">), // pins A,B
        mk({ kind: "REQUIRES", a: "A", b: "C" } as Omit<Constraint, "id">),
        mk({ kind: "REQUIRES", a: "C", b: "D" } as Omit<Constraint, "id">),
        mk({ kind: "REQUIRES", a: "D", b: "E" } as Omit<Constraint, "id">),
        mk({ kind: "REQUIRES", a: "E", b: "F" } as Omit<Constraint, "id">)
      ],

      // Contradictory set → demonstrates contradiction banner + auto-normalize
      PARADOX: [
        mk({ kind: "EXACTLY_K_OF_SET", set: ["A","B"], k: 1 } as Omit<Constraint, "id">),
        mk({ kind: "REQUIRES", a: "A", b: "B" } as Omit<Constraint, "id">),
        mk({ kind: "NOT_TOGETHER", a: "A", b: "B" } as Omit<Constraint, "id">)
      ]
    };

    setConstraintsWithHistory(presets[name], `preset: ${name.toLowerCase()}`);
  }

  function mkPackConstraint(c: Omit<Constraint, "id">): Constraint {
    return { id: uid(), ...c } as Constraint;
  }

  function loadPack(mode: "REPLACE" | "APPEND") {
    const pack = PACKS.find(p => p.name === packName);
    if (!pack) return;
    const built = pack.build(mkPackConstraint, states);

    if (mode === "REPLACE") {
      setConstraintsWithHistory(built, `pack: ${pack.name.toLowerCase()}`);
    } else {
      // append on top, keep newest-first convention
      setConstraintsWithHistory([...built, ...constraints], `pack+: ${pack.name.toLowerCase()}`);
    }
  }

  async function exportScenario() {
    const payload = { states, constraints };
    const txt = JSON.stringify(payload);
    setIoText(txt);
    setHashFromConstraints(constraints);
    try { await navigator.clipboard.writeText(window.location.href); } catch {}
  }

  function importScenario() {
    try {
      const parsed = JSON.parse(ioText);
      if (!parsed || !Array.isArray(parsed.states) || !Array.isArray(parsed.constraints)) return;

      // Basic validation: states are strings; constraints have id/kind
      const nextStates = parsed.states.filter((s: any) => typeof s === "string").map((s: string) => s.toUpperCase());
      const nextConstraints = parsed.constraints.filter((c: any) => c && typeof c.id === "string" && typeof c.kind === "string");

      // Filter constraints to only those referencing valid states:
      const valid = new Set(states);
      const filtered = nextConstraints.filter((c: any) => {
        if (c.kind === "NOT_TOGETHER" || c.kind === "REQUIRES") return valid.has(c.a) && valid.has(c.b);
        if (c.kind === "AT_MOST_K_OF_SET" || c.kind === "EXACTLY_K_OF_SET") return Array.isArray(c.set) && c.set.every((x: any) => valid.has(x));
        return false;
      });

      setConstraintsWithHistory(filtered, "imported scenario");
      const p = new URLSearchParams(window.location.search);
      if (p.has("seed")) {
        p.delete("seed");
        window.history.replaceState({}, "", `${window.location.pathname}?${p.toString()}${window.location.hash}`);
      }
    } catch {
      // ignore invalid
    }
  }

  function statusOf(s: StateId): "INEVITABLE" | "IMPOSSIBLE" | "POSSIBLE" {
    if (analysis.inevitable.has(s)) return "INEVITABLE";
    if (analysis.impossible.has(s)) return "IMPOSSIBLE";
    return "POSSIBLE";
  }

  function edgesFromConstraints() {
    const edges: Array<{ from: StateId; to: StateId; label: string }> = [];
    for (const c of constraints) {
      if (c.kind === "NOT_TOGETHER") edges.push({ from: c.a, to: c.b, label: "¬∧" });
      if (c.kind === "REQUIRES") edges.push({ from: c.a, to: c.b, label: "→" });
      if (c.kind === "NEXT_REQUIRES") edges.push({ from: c.a, to: c.b, label: "→(t+1)" });
      if (c.kind === "PERSIST") edges.push({ from: c.s, to: c.s, label: "persist" });
    }
    return edges;
  }

  function setConstraintsOfKind(kind: "AT_MOST_K_OF_SET" | "EXACTLY_K_OF_SET") {
    return constraints.filter((c): c is Extract<Constraint, { kind: typeof kind }> => c.kind === kind);
  }

  return (
    <div className={stage ? "stage" : ""}>
      <div className="container" ref={rootRef}>
      <div className="h1">Constraint Universe — <span className="mono">{universeName()}</span></div>
      {embed && (
        <div className="small" style={{ opacity: 0.7, marginBottom: 8 }}>Read-only snapshot.</div>
      )}
      <p className="sub">
        You can only change <span className="kbd">constraints</span>. The universe reconfigures itself.
        <br />
        A state is <span className="kbd">Possible</span> if it appears in at least one allowed world,{" "}
        <span className="kbd">Inevitable</span> if it appears in every allowed world.
      </p>

      {!embed && (
        <div className="row" style={{ marginBottom: 14 }}>
          <span className="helpLink small" onClick={() => setShowHelp(true)}>Help / cheat sheet</span>
        </div>
      )}

      {!embed && (
        <div className="row" style={{ marginBottom: 14 }}>
          <button className="btn" onClick={() => setMode("EXPLORATION")} disabled={mode === "EXPLORATION"}>
            Exploration
          </button>
          <button className="btn" onClick={() => setMode("STUDY")} disabled={mode === "STUDY"}>
            Study
          </button>
          <button className="btn" onClick={() => setDemo(d => !d)}>
            {demo ? "Demo: on" : "Demo: off"}
          </button>
          <button className="btn" onClick={() => { setStage(s => !s); toggleFullscreen(); }}>
            {stage ? "Stage: on" : "Stage: off"}
          </button>
          <button className="btn" onClick={() => setActiveU(u => (u === "A" ? "B" : "A"))}>
            Universe: {activeU}
          </button>
          <button className="btn" onClick={() => setCompare(c => !c)}>
            {compare ? "Compare: on" : "Compare: off"}
          </button>
          <span className="pill">{mode === "EXPLORATION" ? "all controls" : "reduced UI"}</span>
        </div>
      )}

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="small">Constraint scale</div>
        <input
          className="input"
          type="range"
          min={6}
          max={16}
          value={scale}
          onChange={e => setScale(parseInt(e.target.value, 10))}
          style={{ width: 260 }}
        />
        <span className="pill">{states.length} states</span>
        <span className="small">Brute-force safe ≤ 16</span>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="small">Time horizon</div>
        <input
          className="input"
          type="range"
          min={0}
          max={8}
          value={horizon}
          onChange={e => setHorizon(parseInt(e.target.value, 10))}
          style={{ width: 260 }}
        />
        <span className="pill">T={horizon}</span>
        <span className="small" style={{ opacity: 0.8 }}>BMC: states are S@0..S@T</span>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="small">Solver</div>
        <select className="select" value={solverId} onChange={e => setSolverId(e.target.value as SolverId)}>
          {SOLVERS.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <span className="pill">{solver.id}</span>
        {verified && (
          <span className="pill" style={{ marginLeft: 8 }}>
            {verified.ok ? "verified" : "mismatch"}
          </span>
        )}
        {(horizon > 0 || constraints.some(c => c.kind === "NEXT_REQUIRES")) && (
          <span className="pill" style={{ marginLeft: 8 }}>temporal: SAT-only</span>
        )}
      </div>
      {(horizon > 0 || constraints.some(c => c.kind === "NEXT_REQUIRES" || c.kind === "PERSIST")) && (
        <div className="small" style={{ opacity: 0.7, marginTop: 4 }}>
          Temporal analysis uses bounded model checking (SAT-only).
        </div>
      )}

      {compare && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="mono">Compare A vs B</div>
            <span className="pill">
              A:{currentFrameConstraints("A").length} constraints · B:{currentFrameConstraints("B").length} constraints
            </span>
          </div>

          <div className="hr" />

          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <span className="pill">A inevitable {analysisA.inevitable.size}</span>
            <span className="pill">B inevitable {analysisB.inevitable.size}</span>
            <span className="pill">Δ inevitable {(analysisA.inevitable.size - analysisB.inevitable.size)}</span>
            <span className="pill">A possible {analysisA.possible.size}</span>
            <span className="pill">B possible {analysisB.possible.size}</span>
            <span className="pill">Δ possible {(analysisA.possible.size - analysisB.possible.size)}</span>
          </div>

          <div className="hr" />

          <div className="states" style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}>
            {states.map(s => {
              const stA =
                analysisA.inevitable.has(s) ? "INEVITABLE" :
                analysisA.impossible.has(s) ? "IMPOSSIBLE" : "POSSIBLE";
              const stB =
                analysisB.inevitable.has(s) ? "INEVITABLE" :
                analysisB.impossible.has(s) ? "IMPOSSIBLE" : "POSSIBLE";
              const same = stA === stB;

              return (
                <div key={s} className="state" style={{ minHeight: 64, opacity: same ? 0.85 : 1 }}>
                  <div className="itemHead">
                    <div className="mono">{s}</div>
                    <span className="pill">{same ? "same" : "diff"}</span>
                  </div>
                  <div className="small" style={{ marginTop: 8, lineHeight: 1.5 }}>
                    <div><span className="mono">A</span>: {stA}</div>
                    <div><span className="mono">B</span>: {stB}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="small" style={{ marginTop: 10 }}>
            Tip: switch active universe (A/B) to edit its constraints; Compare shows the delta live.
          </div>
        </div>
      )}

      <div className="grid">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="small">States</div>
              <div className="small mono">{states.join(" ")}</div>
              {!demo && (
                <>
                  <div className="small" style={{ marginTop: 6 }}>
                    Solver: <span className="mono">{analysis.perf ? analysis.perf.worlds.toLocaleString() : "?"}</span> worlds,
                    <span className="mono"> {analysis.perf ? analysis.perf.ms.toFixed(1) : "?"}ms</span>
                    {states.length >= 15 && (
                      <span className="pill" style={{ marginLeft: 8 }}>heavy</span>
                    )}
                  </div>
                  <div className="hr" />
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="small">Time (constraints as frames)</div>
                    <span className="pill">t{tIndex}</span>
                  </div>
                  <div className="row" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      type="range"
                      min={0}
                      max={Math.max(0, frames.length - 1)}
                      value={tIndex}
                      onChange={e => setTIndex(parseInt(e.target.value, 10))}
                      style={{ width: 260 }}
                    />
                    <span className="mono">{frames[tIndex]?.label ?? `t${tIndex}`}</span>
                  </div>

                  {mode === "EXPLORATION" && (
                    <div className="row" style={{ marginTop: 10 }}>
                      <button className="btn" onClick={() => newFrame()}>New frame</button>
                      <button className="btn" onClick={duplicateFrame} disabled={frames.length === 0}>Duplicate</button>
                    </div>
                  )}
                  <div className="row" style={{ marginTop: 8 }}>
                    {(() => {
                      const n = states.length || 1;
                      const poss = analysis.possible.size / n;
                      const inev = analysis.inevitable.size / n;
                      const shaping = inev * (1 - poss);
                      return (
                        <>
                          <span className="pill">possible {Math.round(poss * 100)}%</span>
                          <span className="pill">inevitable {Math.round(inev * 100)}%</span>
                          <span className="pill">shaping {Math.round(shaping * 100)}%</span>
                        </>
                      );
                    })()}
                  </div>
                  {states.length >= 15 && (
                    <div className="small" style={{ marginTop: 6 }}>
                      Tip: for smoother play, keep scale ≤ 14 or reduce constraints.
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="row">
              <button className="btn" onClick={reset}>Clear constraints</button>
              <button className="btn" onClick={normalize} disabled={analysis.witnessWorld !== null}>
                Auto-normalize
              </button>
              <button className="btn" onClick={undo} disabled={undoRef.current.length === 0}>Undo</button>
              <button className="btn" onClick={redo} disabled={redoRef.current.length === 0}>Redo</button>
            </div>
          </div>

          <div className="hr" />

          {verified && !verified.ok && (
            <div className="banner" style={{ marginTop: 10 }}>
              <div className="mono">Verification mismatch</div>
              <div className="small" style={{ marginTop: 6, lineHeight: 1.45 }}>
                SAT vs brute disagree at N≤12. This indicates a bug in CNF/SAT encoding.
              </div>
              <div className="small" style={{ marginTop: 6 }}>
                sat: <span className="mono">{verified.satSig}</span>
                {" "} brute: <span className="mono">{verified.bruteSig}</span>
              </div>
            </div>
          )}

          {analysis.witnessWorld === null && (
            <>
              <div className="item" style={{ borderColor: "#5a2a2a" as any }}>
                <div className="itemHead">
                  <div className="mono">CONTRADICTION</div>
                  <span className="pill">no allowed worlds</span>
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  Current constraints forbid every possible world. Remove a constraint, or press <span className="kbd">Auto-normalize</span>.
                </div>
                {analysis.fixes && analysis.fixes.options.length > 0 && (
                  <div className="small" style={{ marginTop: 8, lineHeight: 1.45 }}>
                    <div className="small" style={{ opacity: 0.7, marginBottom: 4 }}>Repairs</div>
                    Minimal fix sets (remove all in a set):
                    <div style={{ marginTop: 6 }}>
                      {analysis.fixes.options.slice(0, 4).map((opt, i) => (
                        <div key={i} className="mono">
                          {i + 1}. {opt.pretty.join(" + ")}
                        </div>
                      ))}
                      {analysis.fixes.options.length > 4 && <div className="mono">…</div>}
                    </div>
                  </div>
                )}
              </div>
              <div className="hr" />
            </>
          )}

          <div className="small" style={{ opacity: 0.7, marginBottom: 8 }}>Logical Status</div>
          <div className="states">
            {states.map(s => {
              const st = statusOf(s);
              return (
                <div className="state" key={s}>
                  <div className="itemHead">
                    <div className="mono" style={{ fontSize: 16 }}>{s}</div>
                    <span className="badge">
                      <span className="pill">{badge(st)}</span>
                      {st === "INEVITABLE" && <span className="pill" style={{ marginLeft: 6, opacity: 0.6 }}>proved (bounded)</span>}
                      {st === "IMPOSSIBLE" && <span className="pill" style={{ marginLeft: 6, opacity: 0.6 }}>proved (bounded)</span>}
                      {st === "POSSIBLE" && <span className="pill" style={{ marginLeft: 6, opacity: 0.6 }}>satisfiable</span>}
                    </span>
                  </div>
                  <div className="small" style={{ marginTop: 8, lineHeight: 1.35 }}>
                    {st === "INEVITABLE" && "Must exist under current constraints."}
                    {st === "POSSIBLE" && "Can exist in at least one allowed world."}
                    {st === "IMPOSSIBLE" && "Cannot exist in any allowed world."}
                  </div>
                  {horizon > 0 && analysis.trajectory && (
                    <div className="small" style={{ marginTop: 6, opacity: 0.9 }}>
                      at t={tInspect}:{" "}
                      <span className="mono">
                        {analysis.trajectory[tInspect]?.has(s) ? "true (witness)" : "false (witness)"}
                      </span>
                    </div>
                  )}
                  {((st === "INEVITABLE" || st === "IMPOSSIBLE") && analysis.reasons) && (
                    <>
                      <div className="small" style={{ opacity: 0.7, marginTop: 12, marginBottom: 4 }}>Explanations</div>
                      <div className="small" style={{ marginTop: 0 }}>
                        Why:{" "}
                        <span className="mono">
                          {(() => {
                            const r = analysis.reasons!.get(s);
                            if (!r) return "unknown";
                            if (r.kind === "SET_RULE") return r.rule;
                            if (r.kind === "REQUIRES_CHAIN") return r.chain.join(" → ");
                            if (r.kind === "UNSAT_CORES") {
                              const n = r.cores.length;
                              return `proved by ${n} MUS${n === 1 ? "" : "es"}`;
                            }
                            return "unknown";
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                  {(() => {
                    const r = analysis.reasons?.get(s);
                    if (!r || r.kind !== "UNSAT_CORES") return null;
                    const key = `${activeU}-t${tIndex}-${s}`;
                    return (
                      <>
                        <div className="row" style={{ marginTop: 8 }}>
                          <button className="btn" onClick={() => toggleProof(key)}>
                            {openProof[key] ? "Hide proof" : "Show proof"}
                          </button>
                        </div>
                        {openProof[key] && (
                          <div className="item" style={{ marginTop: 10 }}>
                            <div className="mono">Minimal proofs (MUS)</div>
                            <div className="small" style={{ marginTop: 6, lineHeight: 1.5 }}>
                              Goal: <span className="mono">{r.goal}</span> for <span className="mono">{r.state}</span>
                            </div>

                            {r.cores.map((core, idx) => (
                              <div key={idx} style={{ marginTop: 10 }}>
                                <div className="small mono">MUS {idx + 1}</div>
                                <div className="small" style={{ marginTop: 6, lineHeight: 1.6 }}>
                                  {core.pretty.map((p, i) => (
                                    <div key={i} className="mono">• {p}</div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {analysis.witnesses?.get(s) && (
                              <>
                                <div className="small" style={{ marginTop: 10 }}>
                                  Witness world (S is true):
                                </div>
                                <div className="mono" style={{ marginTop: 6 }}>
                                  {"{"}{Array.from(analysis.witnesses.get(s)!).sort().join(", ")}{"}"}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          <div className="hr" />

          {!demo && (
            <>
              <div className="small">Constraint tension (top 5)</div>
              <div className="list" style={{ marginTop: 10 }}>
                {!analysis.tension || analysis.tension.length === 0 ? (
                  <div className="item">
                    <div className="mono">∅</div>
                    <div className="small" style={{ marginTop: 6 }}>
                      Add constraints to see which ones remove the most worlds.
                    </div>
                  </div>
                ) : (
                  analysis.tension.map((t) => (
                    <div className="item" key={t.id}>
                      <div className="itemHead">
                        <div className="mono">{t.label}</div>
                        <span className="pill">Δ {t.delta.toLocaleString()}</span>
                      </div>
                      <div className="small" style={{ marginTop: 6 }}>
                        Worlds removed by this constraint (higher means stronger shaping).
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hr" />
            </>
          )}

          {lastNormalize && (
            <div className="small" style={{ marginBottom: 8 }}>
              Auto-normalize removed <span className="mono">{lastNormalize.removed}</span> constraint(s).
            </div>
          )}

          <div className="small">
            Witness world (one allowed configuration):{" "}
            <span className="mono">
              {analysis.witnessWorld ? Array.from(analysis.witnessWorld).sort().join(" ") : "∅ (no allowed worlds)"}
            </span>
          </div>

          {horizon > 0 && (
            <>
              <div className="hr" />
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="mono">Timeline inspector</div>
                <span className="pill">t={tInspect}</span>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <input
                  className="input"
                  type="range"
                  min={0}
                  max={horizon}
                  value={tInspect}
                  onChange={(e) => setTInspect(parseInt(e.target.value, 10))}
                  style={{ width: 260 }}
                />
                <span className="small" style={{ opacity: 0.85 }}>scrub witness trajectory</span>
              </div>

              <div className="item" style={{ marginTop: 10 }}>
                <div className="small">Witness world at time t</div>
                <div className="mono" style={{ marginTop: 6 }}>
                  {analysis.trajectory && analysis.trajectory[tInspect]
                    ? `{${Array.from(analysis.trajectory[tInspect]!).sort().join(", ")}}`
                    : "∅"}
                </div>
              </div>
            </>
          )}

          {horizon > 0 && isSatSolver(solverId) && (
            <>
              <div className="hr" />
              <div className="small" style={{ opacity: 0.7, marginBottom: 8 }}>Questions</div>
              <div className="mono">Temporal query</div>

              <div className="row" style={{ marginTop: 10, gap: 10, flexWrap: "wrap" }}>
                <select className="input" value={qMode} onChange={(e) => setQMode(e.target.value as any)}>
                  <option value="STATE">State query</option>
                  <option value="REACH_EXACT">Reach exact set</option>
                  <option value="EVENTUALLY">Eventually (∃t ≤ T)</option>
                  <option value="ALWAYS">Always (∀t ≤ T)</option>
                </select>

                {qMode === "REACH_EXACT" ? (
                  <>
                    <input
                      className="input"
                      value={qTarget}
                      onChange={(e) => setQTarget(e.target.value)}
                      placeholder="target set e.g. B,C"
                      style={{ width: 220 }}
                    />
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={wMissing}
                      onChange={(e) => setWMissing(Math.max(1, parseInt(e.target.value || "1", 10)))}
                      style={{ width: 90 }}
                      title="weight for missing target states"
                    />
                    <span className="small" style={{ opacity: 0.85 }}>w(miss)</span>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      value={wExtra}
                      onChange={(e) => setWExtra(Math.max(1, parseInt(e.target.value || "1", 10)))}
                      style={{ width: 90 }}
                      title="weight for extra states"
                    />
                    <span className="small" style={{ opacity: 0.85 }}>w(extra)</span>
                  </>
                ) : (
                  <>
                    <select className="input" value={qState} onChange={(e) => setQState(e.target.value)}>
                      {states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    {qMode === "STATE" && (
                      <select className="input" value={String(qWant)} onChange={(e) => setQWant(e.target.value as any)}>
                        <option value="TRUE">is TRUE</option>
                        <option value="FALSE">is FALSE</option>
                      </select>
                    )}
                  </>
                )}

                <input
                  className="input"
                  type="number"
                  min={0}
                  max={horizon}
                  value={qTime}
                  onChange={(e) => setQTime(Math.max(0, Math.min(horizon, parseInt(e.target.value || "0", 10))))}
                  style={{ width: 90 }}
                />

                <button className="btn" onClick={runQuery}>Run</button>
              </div>

              {qResult && qResult.status === "SAT" && (
                <div className="item" style={{ marginTop: 10 }}>
                  <div className="small">
                    Result: SAT (possible){qResult.note ? ` — ${qResult.note}` : ""}{typeof qResult.t === "number" ? ` (t=${qResult.t})` : ""}
                  </div>
                  <div className="mono" style={{ marginTop: 6 }}>
                    witness{typeof qResult.t === "number" ? `@t=${qResult.t}` : "@t"}: {"{"}{Array.from(qResult.witnessAtT).sort().join(", ")}{"}"}
                  </div>
                </div>
              )}

              {qResult && qResult.status === "UNSAT" && (
                <div className="item" style={{ marginTop: 10 }}>
                  <div className="small">Result: UNSAT</div>
                  {qResult.note && (
                    <div className="small" style={{ marginTop: 6, opacity: 0.9 }}>
                      {qResult.note}
                    </div>
                  )}

                  <div className="small" style={{ marginTop: 10 }}>Minimal proofs (MUS)</div>
                  <div className="small" style={{ marginTop: 6, lineHeight: 1.6 }}>
                    {(qResult.muses ?? []).slice(0, 3).map((m: any, i: number) => (
                      <div key={i} className="mono">{`MUS ${i + 1}: `}{m.pretty.join(" · ")}</div>
                    ))}
                  </div>

                  <div className="small" style={{ marginTop: 10 }}>Minimal fix sets (MCS, k≤3)</div>
                  <div className="small" style={{ marginTop: 6, lineHeight: 1.6 }}>
                    {(qResult.mcs ?? []).slice(0, 4).map((m: any, i: number) => (
                      <div key={i} className="mono">{`${i + 1}. `}{m.pretty.join(" + ")}</div>
                    ))}
                  </div>

                  {qResult.closest && (
                    <div className="item" style={{ marginTop: 12 }}>
                      <div className="small">
                        Closest reachable (min cost k={qResult.closest.k} (w(miss)={wMissing}, w(extra)={wExtra}))
                      </div>
                      <div className="mono" style={{ marginTop: 6 }}>
                        witness@t={qTime}: {"{"}{Array.from(qResult.closest.witnessAtT).sort().join(", ")}{"}"}
                      </div>
                      <div className="small" style={{ marginTop: 8, lineHeight: 1.5 }}>
                        {qResult.closest.missing.length > 0 && (
                          <div>missing: <span className="mono">{qResult.closest.missing.join(", ")}</span></div>
                        )}
                        {qResult.closest.extra.length > 0 && (
                          <div>extra: <span className="mono">{qResult.closest.extra.join(", ")}</span></div>
                        )}
                        {qResult.closest.missing.length === 0 && qResult.closest.extra.length === 0 && (
                          <div className="mono">exact target achieved (unexpected)</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {isSatSolver(solverId) && (
            <>
              <div className="hr" />
              <div className="small" style={{ opacity: 0.7, marginBottom: 8 }}>Diagnostics</div>
              <div className="mono">Thermodynamics (approx)</div>

              <div className="row" style={{ marginTop: 10, gap: 10, flexWrap: "wrap" }}>
                <div className="small" style={{ opacity: 0.85 }}>t</div>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={horizon}
                  value={probT}
                  onChange={(e) => setProbT(Math.max(0, Math.min(horizon, parseInt(e.target.value || "0", 10))))}
                  style={{ width: 80 }}
                />

                <div className="small" style={{ opacity: 0.85 }}>samples</div>
                <input
                  className="input"
                  type="number"
                  min={20}
                  max={500}
                  value={probN}
                  onChange={(e) => setProbN(Math.max(20, Math.min(500, parseInt(e.target.value || "80", 10))))}
                  style={{ width: 90 }}
                />

                <select className="input" value={thermoMode} onChange={(e) => setThermoMode(e.target.value as any)}>
                  <option value="UNIFORM">Uniform</option>
                  <option value="BOLTZMANN">Temperature</option>
                  <option value="COUNT_CI">Count + CI</option>
                </select>
                <div className="small" style={{ opacity: 0.7, width: "100%", marginTop: 4 }}>
                  {thermoMode === "UNIFORM" && "heuristic sampling"}
                  {thermoMode === "BOLTZMANN" && "biased sampling (exploratory)"}
                  {thermoMode === "COUNT_CI" && "approximate counting (with bounds)"}
                </div>

                {thermoMode === "UNIFORM" ? (
                  <button className="btn" disabled={probBusy} onClick={runProbabilityEstimate}>
                    {probBusy ? "Sampling…" : "Estimate P(S@t)"}
                  </button>
                ) : thermoMode === "BOLTZMANN" ? (
                  <button className="btn" disabled={probBusy} onClick={runTemperatureEstimate}>
                    {probBusy ? "Sampling…" : "Estimate at Temperature"}
                  </button>
                ) : (
                  <button className="btn" disabled={ciBusy} onClick={runCountCI}>
                    {ciBusy ? "Counting…" : "Estimate with CI"}
                  </button>
                )}

                {probStats && thermoMode === "UNIFORM" && (
                  <>
                    <span className="pill">got {probStats.samples}</span>
                    <span className="pill">H≈{Number(probStats.entropyBits).toFixed(2)} bits</span>
                  </>
                )}
              </div>

              {thermoMode === "COUNT_CI" && (
                <div className="row" style={{ marginTop: 10, gap: 10, flexWrap: "wrap" }}>
                  <div className="small" style={{ opacity: 0.85 }}>trials</div>
                  <input
                    className="input"
                    type="number"
                    min={10}
                    max={120}
                    value={ciTrials}
                    onChange={(e) => setCiTrials(Math.max(10, Math.min(120, parseInt(e.target.value || "30", 10))))}
                    style={{ width: 90 }}
                  />
                  {ciStats?.total && (
                    <>
                      <span className="pill">k={ciStats.total.k}</span>
                      <span className="pill">p≈{Math.round(ciStats.total.p * 100)}%</span>
                      <span className="pill">
                        |F|≈{Math.round(ciStats.total.est)} [{Math.round(ciStats.total.lo)}, {Math.round(ciStats.total.hi)}]
                      </span>
                    </>
                  )}
                </div>
              )}

              {thermoMode === "BOLTZMANN" && (
                <div className="row" style={{ marginTop: 10, gap: 10, flexWrap: "wrap" }}>
                  <div className="small" style={{ opacity: 0.85 }}>T</div>
                  <input
                    className="input"
                    type="number"
                    min={0.01}
                    step={0.05}
                    value={tempT}
                    onChange={(e) => setTempT(Math.max(0.01, parseFloat(e.target.value || "1")))}
                    style={{ width: 90 }}
                  />

                  <input
                    className="input"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    placeholder="target set e.g. B,C"
                    style={{ width: 220 }}
                  />

                  <div className="small" style={{ opacity: 0.85 }}>w(miss)</div>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={tempWMiss}
                    onChange={(e) => setTempWMiss(Math.max(1, parseInt(e.target.value || "2", 10)))}
                    style={{ width: 80 }}
                  />

                  <div className="small" style={{ opacity: 0.85 }}>w(extra)</div>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={tempWExtra}
                    onChange={(e) => setTempWExtra(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    style={{ width: 80 }}
                  />

                  {tempStats && (
                    <>
                      <span className="pill">H≈{Number(tempStats.entropyBits).toFixed(2)} bits</span>
                      <span className="pill">⟨E⟩≈{Number(tempStats.avgEnergy).toFixed(2)}</span>
                    </>
                  )}
                </div>
              )}

              {probStats && thermoMode === "UNIFORM" && (
                <div className="item" style={{ marginTop: 10 }}>
                  <div className="small">Approx probabilities at t={probStats.t}</div>
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    {states.slice().sort().map((s) => (
                      <div key={s} className="row" style={{ justifyContent: "space-between" }}>
                        <span className="mono">{s}</span>
                        <span className="mono">{Math.round((probStats.p[s] ?? 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="small" style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.5 }}>
                    Entropy H is a "phase" indicator: higher means many degrees of freedom; lower means constraints collapse possibilities.
                  </div>
                </div>
              )}

              {tempStats && thermoMode === "BOLTZMANN" && (
                <div className="item" style={{ marginTop: 10 }}>
                  <div className="small">
                    Temperature estimate at t={tempStats.t} (T={Number(tempStats.T).toFixed(2)})
                  </div>
                  <div className="small" style={{ marginTop: 6, opacity: 0.85 }}>
                    target: <span className="mono">{`{${(tempStats.target ?? []).slice().sort().join(", ")}}`}</span>
                  </div>
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    {states.slice().sort().map((s) => (
                      <div key={s} className="row" style={{ justifyContent: "space-between" }}>
                        <span className="mono">{s}</span>
                        <span className="mono">{Math.round((tempStats.p[s] ?? 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="small" style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.5 }}>
                    Cold (low T) concentrates probability near low-energy worlds (close to target). Hot (high T) spreads mass and increases entropy.
                  </div>
                </div>
              )}

              {thermoMode === "COUNT_CI" && ciStats && (
                <div className="item" style={{ marginTop: 10 }}>
                  <div className="small">Hash-count estimate at t={ciStats.t} (Wilson CI, trials={ciStats.trials})</div>
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                    {states.slice().sort().map((s) => {
                      const x = ciStats.probs?.[s];
                      const mid = Math.round((x?.est ?? 0) * 100);
                      const lo = Math.round((x?.lo ?? 0) * 100);
                      const hi = Math.round((x?.hi ?? 1) * 100);
                      return (
                        <div key={s} className="row" style={{ justifyContent: "space-between" }}>
                          <span className="mono">{s}</span>
                          <span className="mono">{mid}% [{lo},{hi}]</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="small" style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.5 }}>
                    This uses random XOR hashing (universal hashing) to estimate counts and produce stable confidence intervals.
                    Wider intervals mean the universe is too tight/too loose for the current trials—raise trials for stability.
                  </div>
                </div>
              )}
            </>
          )}

          {embed && (
            <>
              <div className="hr" />
              <div className="small">Constraint Graph</div>
              <div className="item" style={{ marginTop: 10 }}>
                <div className="itemHead">
                  <div className="mono">Edges</div>
                  <span className="pill">{edgesFromConstraints().length}</span>
                </div>
                <div className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>
                  {edgesFromConstraints().length === 0 ? (
                    <span className="mono">∅</span>
                  ) : (
                    edgesFromConstraints().map((e, i) => (
                      <div key={i} className="mono">{e.from} {e.label} {e.to}</div>
                    ))
                  )}
                </div>
              </div>

              <div className="hr" />

              <div className="item">
                <div className="itemHead">
                  <div className="mono">Set rules</div>
                  <span className="pill">
                    {setConstraintsOfKind("AT_MOST_K_OF_SET").length + setConstraintsOfKind("EXACTLY_K_OF_SET").length}
                  </span>
                </div>
                <div className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>
                  {[...setConstraintsOfKind("AT_MOST_K_OF_SET"), ...setConstraintsOfKind("EXACTLY_K_OF_SET")].length === 0 ? (
                    <span className="mono">∅</span>
                  ) : (
                    <>
                      {setConstraintsOfKind("AT_MOST_K_OF_SET").map((c) => (
                        <div key={c.id} className="mono">|{`{${c.set.join(",")}}`}| ≤ {c.k}</div>
                      ))}
                      {setConstraintsOfKind("EXACTLY_K_OF_SET").map((c) => (
                        <div key={c.id} className="mono">|{`{${c.set.join(",")}}`}| = {c.k}</div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {demo && (
            <>
              <div className="hr" />
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="small">Camera script</div>
                <div className="row">
                  <button className="btn" onClick={() => setScript(generateScript())}>Generate script</button>
                  <button className="btn" onClick={copyScript} disabled={!script.trim()}>Copy</button>
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <textarea
                  className="input"
                  value={script}
                  readOnly
                  rows={8}
                  style={{ width: "100%", resize: "vertical" }}
                  placeholder="Generate a short script for recording…"
                />
              </div>
            </>
          )}

          {!demo && (
            <>
              <div className="hr" />
              <div className="small">Snapshots</div>
              <div className="row" style={{ marginTop: 10 }}>
                {snapshots.length === 0 ? (
                  <span className="mono">∅</span>
                ) : (
                  snapshots.map(s => (
                    <button key={s.id} className="btn" onClick={() => jumpToSnapshot(s)}>
                      {s.label}
                    </button>
                  ))
                )}
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                Jump to a previous universe state (kept to the last 12).
              </div>

              <div className="hr" />
              <div className="small">Narration</div>
              <div className="list" style={{ marginTop: 10 }}>
                {log.length === 0 ? (
                  <div className="item">
                    <div className="mono">∅</div>
                    <div className="small" style={{ marginTop: 6 }}>
                      Actions will appear here as you change constraints.
                    </div>
                  </div>
                ) : (
                  log.map((m, i) => (
                    <div className="item" key={i}>
                      <div className="mono">{m}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {!embed && (
          <div className="card">
            {mode === "EXPLORATION" && (
            <>
              <div className="small">Add a constraint</div>
              <div className="row" style={{ marginTop: 10 }}>
                <select className="select" value={kind} onChange={e => setKind(e.target.value as DraftKind)}>
                  <option value="NOT_TOGETHER">NOT_TOGETHER (A and B cannot both exist)</option>
                  <option value="REQUIRES">REQUIRES (If A exists, B must exist)</option>
                  <option value="NEXT_REQUIRES">NEXT_REQUIRES (A@t → B@t+1)</option>
                  <option value="PERSIST">PERSIST (S@t → S@t+1)</option>
                  <option value="AT_MOST_K_OF_SET">AT_MOST_K_OF_SET (At most k of {set} may exist)</option>
                  <option value="EXACTLY_K_OF_SET">EXACTLY_K_OF_SET (Exactly k of {set} must exist)</option>
                </select>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                {(kind === "NOT_TOGETHER" || kind === "REQUIRES") && (
                  <>
                    <label className="small">A</label>
                    <select className="select" value={a} onChange={e => setA(e.target.value as StateId)}>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label className="small">B</label>
                    <select className="select" value={b} onChange={e => setB(e.target.value as StateId)}>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}

                {(kind === "AT_MOST_K_OF_SET" || kind === "EXACTLY_K_OF_SET") && (
                  <>
                    <label className="small">set</label>
                    <input
                      className="input"
                      value={setList}
                      onChange={e => setSetList(e.target.value)}
                      placeholder="E,F,G"
                    />
                    <label className="small">k</label>
                    <input
                      className="input"
                      type="number"
                      value={k}
                      onChange={e => setK(parseInt(e.target.value || "0", 10))}
                      style={{ width: 90 }}
                    />
                  </>
                )}
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={addConstraint}>Add</button>
              </div>

              <div className="hr" />

              <div className="small">Constraint Library</div>
              <div className="row" style={{ marginTop: 10 }}>
                <select className="select" value={packName} onChange={e => setPackName(e.target.value as PackName)}>
                  {PACKS.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="small" style={{ marginTop: 8, lineHeight: 1.35 }}>
                {PACKS.find(p => p.name === packName)?.description}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => loadPack("REPLACE")}>Load pack</button>
                <button className="btn" onClick={() => loadPack("APPEND")}>Append pack</button>
              </div>

              <div className="hr" />

              <div className="small">Presets</div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => loadPreset("CRYSTAL")}>Crystal</button>
                <button className="btn" onClick={() => loadPreset("CHAOS")}>Chaos</button>
                <button className="btn" onClick={() => loadPreset("CHAIN")}>Chain</button>
                <button className="btn" onClick={() => loadPreset("PARADOX")}>Paradox</button>
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                Crystal → inevitability. Chaos → possibility. Chain → "why" paths. Paradox → contradiction.
              </div>

              <div className="hr" />
            </>
          )}

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="small">Constraints</div>
            <div className="row">
              <button className="btn" onClick={() => setView("LIST")} disabled={view === "LIST"}>List</button>
              <button className="btn" onClick={() => setView("GRAPH")} disabled={view === "GRAPH"}>Graph</button>
              {mode === "EXPLORATION" && (
                <button className="btn" onClick={toggleHelp}>Help</button>
              )}
              <span className="pill">{constraints.length}</span>
            </div>
          </div>

          {view === "LIST" && (
            <div className="list" style={{ marginTop: 10 }}>
              {constraints.map(c => (
                <div className="item" key={c.id}>
                  <div className="itemHead">
                    <div className="mono">
                      {c.kind === "NOT_TOGETHER" && `¬(${c.a} ∧ ${c.b})`}
                      {c.kind === "REQUIRES" && `${c.a} → ${c.b}`}
                      {c.kind === "AT_MOST_K_OF_SET" && `|{${c.set.join(",")}}| ≤ ${c.k}`}
                      {c.kind === "EXACTLY_K_OF_SET" && `|{${c.set.join(",")}}| = ${c.k}`}
                    </div>
                    <button className="btn" onClick={() => removeConstraint(c.id)}>Remove</button>
                  </div>
                  <div className="small" style={{ marginTop: 6, lineHeight: 1.35 }}>
                    {c.kind === "NOT_TOGETHER" && "These two states cannot co-exist in the same allowed world."}
                    {c.kind === "REQUIRES" && "If the left state exists, the right state must also exist."}
                    {c.kind === "AT_MOST_K_OF_SET" && "In any allowed world, only up to k states from the set may exist."}
                    {c.kind === "EXACTLY_K_OF_SET" && "In any allowed world, exactly k states from the set must exist."}
                  </div>
                </div>
              ))}

              {constraints.length === 0 && (
                <div className="item">
                  <div className="mono">No constraints.</div>
                  <div className="small" style={{ marginTop: 6 }}>
                    With no constraints, every state is Possible and none are Inevitable.
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "GRAPH" && (
            <div style={{ marginTop: 10 }}>
              <div className="small" style={{ marginBottom: 8 }}>
                Structure view: pair constraints as edges, set constraints as hyperrules.
              </div>

              <div className="item">
                <div className="itemHead">
                  <div className="mono">Edges</div>
                  <span className="pill">{edgesFromConstraints().length}</span>
                </div>
                <div className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>
                  {edgesFromConstraints().length === 0 ? (
                    <span className="mono">∅</span>
                  ) : (
                    edgesFromConstraints().map((e, i) => (
                      <div key={i} className="mono">{e.from} {e.label} {e.to}</div>
                    ))
                  )}
                </div>
              </div>

              <div className="hr" />

              <div className="item">
                <div className="itemHead">
                  <div className="mono">Set rules</div>
                  <span className="pill">
                    {setConstraintsOfKind("AT_MOST_K_OF_SET").length + setConstraintsOfKind("EXACTLY_K_OF_SET").length}
                  </span>
                </div>

                <div className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>
                  {[...setConstraintsOfKind("AT_MOST_K_OF_SET"), ...setConstraintsOfKind("EXACTLY_K_OF_SET")].length === 0 ? (
                    <span className="mono">∅</span>
                  ) : (
                    <>
                      {setConstraintsOfKind("AT_MOST_K_OF_SET").map((c) => (
                        <div key={c.id} className="mono">|{`{${c.set.join(",")}}`}| ≤ {c.k}</div>
                      ))}
                      {setConstraintsOfKind("EXACTLY_K_OF_SET").map((c) => (
                        <div key={c.id} className="mono">|{`{${c.set.join(",")}}`}| = {c.k}</div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="hr" />

              <div className="small">
                Tip: add <span className="mono">A → B</span> chains and watch which states become <span className="mono">INEVITABLE</span>.
              </div>
            </div>
          )}

          {mode === "EXPLORATION" && (
            <>
              <div className="hr" />

              <div className="small">Scenario IO</div>
              <div className="row" style={{ marginTop: 10 }}>
                <input
                  className="input"
                  value={seed}
                  onChange={e => setSeed(e.target.value)}
                  placeholder="seed (shareable)"
                  style={{ flex: 1, minWidth: 220 }}
                />
                <button className="btn" onClick={randomizeFromSeed}>Randomize</button>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={exportScenario}>Export (copy)</button>
                <button className="btn" onClick={importScenario} disabled={!ioText.trim()}>Import</button>
                <button className="btn" onClick={copyShareUrl}>
                  Copy share URL
                </button>
                <div className="small" style={{ opacity: 0.7, marginTop: 4 }}>Captures current constraints exactly.</div>
                <button className="btn" onClick={printView}>Print / Save</button>
                <button className="btn" onClick={exportPng}>Export PNG</button>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <input
                  className="input"
                  value={ioText}
                  onChange={e => setIoText(e.target.value)}
                  placeholder='Paste exported JSON here…'
                  style={{ width: "100%" }}
                />
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                Tip: Export → paste to a friend → they Import and see the same universe.
              </div>

              <div className="hr" />
            </>
          )}

          <div className="hr" />

          <div className="small">
            Principle: <span className="mono">Nothing changes unless a constraint changes.</span>
          </div>
          </div>
        )}
      </div>

      {showTutorial && !embed && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modalTitle mono">Constraint Universe — first run</div>
            <div className="modalBody">
              You don't move states. You only change <span className="kbd">constraints</span>.
              The universe reconfigures itself.
            </div>

            <div className="steps">
              <div className="step">
                <span className="stepNum mono">1</span>
                Click <span className="kbd">Crystal</span> to see inevitability appear.
              </div>
              <div className="step">
                <span className="stepNum mono">2</span>
                Switch to <span className="kbd">Graph</span> to see structure (edges + set rules).
              </div>
              <div className="step">
                <span className="stepNum mono">3</span>
                Add a <span className="kbd">REQUIRES</span> rule and watch "Why" chains form.
              </div>
            </div>

            <div className="modalActions">
              <button
                className="btn"
                onClick={() => { loadPreset("CRYSTAL"); pushLog("tutorial: loaded crystal"); dismissTutorial(); }}
              >
                Load Crystal
              </button>
              <button className="btn" onClick={dismissTutorial}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {showHelp && !embed && (
        <div className="overlay" role="dialog" aria-modal="true" onClick={toggleHelp}>
          <div className="modal helpModal" onClick={e => e.stopPropagation()}>
            <div className="modalTitle mono">Constraint Universe — cheat sheet</div>
            <div className="modalBody">
              You don't move states. You only change <span className="kbd">constraints</span>. Everything else is a consequence.
            </div>

            <div className="helpCols">
              <div className="item">
                <div className="mono">Share</div>
                <div className="small" style={{ marginTop: 6, lineHeight: 1.45 }}>
                  <div><span className="kbd">Share URL</span>: hash encodes the full world (A/B + time + flags).</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Seed</span>: <span className="mono">?seed=...</span> generates a deterministic universe.</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Embed</span>: <span className="mono">?embed=1</span> read-only.</div>
                </div>
              </div>

              <div className="item">
                <div className="mono">Big knobs</div>
                <div className="small" style={{ marginTop: 6, lineHeight: 1.45 }}>
                  <div><span className="kbd">Universe A/B</span>: two independent universes.</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Compare</span>: live deltas A vs B.</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Time</span>: frames <span className="mono">t0..tN</span> per universe.</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Constraint scale</span>: 6–16 states (brute-force safe).</div>
                </div>
              </div>

              <div className="item">
                <div className="mono">Constraint types</div>
                <div className="small" style={{ marginTop: 6, lineHeight: 1.6 }}>
                  <div className="mono">¬(A ∧ B)</div>
                  <div className="mono">A → B</div>
                  <div className="mono">|{`{S}`}| ≤ k</div>
                  <div className="mono">|{`{S}`}| = k</div>
                </div>
              </div>

              <div className="item">
                <div className="mono">Presentation</div>
                <div className="small" style={{ marginTop: 6, lineHeight: 1.45 }}>
                  <div><span className="kbd">Demo</span>: hides meta panels.</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Stage</span>: fullscreen + bigger layout.</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Export PNG</span>: image snapshot.</div>
                  <div style={{ marginTop: 6 }}><span className="kbd">Camera script</span>: auto narration lines (Demo).</div>
                </div>
              </div>
            </div>

            <div className="modalActions">
              <button className="btn" onClick={() => setShowHelp(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

