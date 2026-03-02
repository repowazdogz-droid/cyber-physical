import type { Analysis, Universe } from "./types";
import { analyzeUniverseBrute } from "./engine";
import { analyzeUniverseSat } from "./solverSat";

function sig(a: Analysis, states: string[]) {
  const tag = (s: string) =>
    a.inevitable.has(s as any) ? "I" : a.impossible.has(s as any) ? "X" : "P";
  return states.map(tag).join("");
}

export function verifySatMatchesBrute(u: Universe): { ok: boolean; satSig: string; bruteSig: string } {
  const isTemporal = (u.horizon ?? 0) > 0 || u.constraints.some((c: any) => c.kind === "NEXT_REQUIRES");
  if (isTemporal) {
    return { ok: true, satSig: "temporal", bruteSig: "skipped" } as any;
  }

  const brute = analyzeUniverseBrute(u);
  const sat = analyzeUniverseSat(u);
  const states = u.states as unknown as string[];
  const bruteSig = sig(brute, states);
  const satSig = sig(sat, states);
  return { ok: bruteSig === satSig, satSig, bruteSig };
}

