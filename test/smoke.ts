import { runAgent } from "../core/runtime";
import { aerospacePack } from "../domains/aerospace/pack";
import type { Identity, LLMAdapter } from "../core/types";

const mockLLM: LLMAdapter = async (prompt: string) => {
  if (/refine|objective/i.test(prompt)) return JSON.stringify({
    objective: "Analyse structural load tolerances for composite fuselage panel",
    success_criteria: ["Identify load limits", "Reference applicable standards", "Flag safety items"],
    constraints: ["No invented specifications", "Cite standards only"],
    scope_in: ["Fatigue loading", "Composite materials"],
    scope_out: ["Manufacturing process", "Cost analysis"],
    assumptions: ["Panel is carbon fibre composite", "Cyclic loading is primary concern"],
    questions: []
  });
  if (/risk|mapper/i.test(prompt)) return JSON.stringify({
    objective: "Analyse structural load tolerances",
    risks: ["Insufficient data on material grade", "Standards may vary by jurisdiction"],
    missing: ["Material specification"]
  });
  if (/plan|tool/i.test(prompt)) return JSON.stringify([
    { tool: "web.search", input: { query: "composite fuselage fatigue FAA standards", limit: 5 } },
    { tool: "drive.search", input: { query: "fuselage load tolerance", limit: 3 } }
  ]);
  if (/critic|review/i.test(prompt)) return JSON.stringify({
    issues: [],
    safe: true,
    fixes: []
  });
  return JSON.stringify({ result: "ok" });
};

const identity: Identity = { userId: "test-user" };

console.log("SMOKE TEST STARTING");

runAgent(
  "Analyse structural load tolerances for a composite fuselage panel under cyclic fatigue loading",
  aerospacePack,
  identity,
  mockLLM,
).then((result) => {
  console.log("STATUS:", result.status);
  console.log("ARTIFACT:", JSON.stringify(result.artifact, null, 2));
  console.log("TRACE EVENTS:", result.trace.length);
  console.log("FULL TRACE:", JSON.stringify(result.trace, null, 2));
  console.log("Smoke test passed.");
}).catch((e) => {
  console.error("SMOKE TEST FAILED:", e);
  process.exit(1);
});

