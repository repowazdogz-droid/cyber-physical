// Universal Agent Runtime
// Intent in -> Artifact out
// Swap domains/ folder to ship a new product

export { runAgent, resumeAgent } from "./core/runtime";

export type {
  DomainPack,
  RunContext,
  Identity,
  LLMAdapter,
} from "./core/types";

export { EventBus } from "./core/events";

// TODO: replace with real pack before use
export const recruitingPack = null;
export { aerospacePack } from "./domains/aerospace/pack";
export { ndTaskThreadPack } from "./domains/nd-task-thread/pack";

