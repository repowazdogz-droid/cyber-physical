import { runAgent } from "../core/runtime";
import { aerospacePack } from "../domains/aerospace/pack";
import { ndTaskThreadPack } from "../domains/nd-task-thread/pack";
import type { Identity } from "../core/types";
import { anthropicLLM } from "../core/llm_anthropic";

const identity: Identity = { userId: "test-user" };

async function main() {
  process.env.MOCK_TOOLS = "false";
  console.log("LIVE TEST STARTING");

  const result: any = await runAgent(
    "Analyse structural load tolerances for a composite fuselage panel under cyclic fatigue loading",
    aerospacePack,
    identity,
    anthropicLLM,
  );

  console.log("STATUS:", result.status);
  console.log("ARTIFACT:", JSON.stringify(result.artifact, null, 2));
  console.log("TRACE EVENTS:", result.trace.length);

  if (result.status === "DONE") {
    console.log("Live test passed.");
  } else {
    console.log("TRACE:", JSON.stringify(result.trace, null, 2));
    process.exit(1);
  }

  console.log("\nND TASK THREAD TEST STARTING");
  const ndResult: any = await runAgent(
    "I need to finish building the universal agent runtime, write up the aerospace domain pack spec, reply to three emails I have been avoiding, and figure out what to cook for dinner. I have about 3 hours.",
    ndTaskThreadPack,
    identity,
    anthropicLLM,
  );
  console.log("ND STATUS:", ndResult.status);
  console.log("ND ARTIFACT:", JSON.stringify(ndResult.artifact, null, 2));
}

main().catch((e: any) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});

