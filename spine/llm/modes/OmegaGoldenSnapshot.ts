// spine/llm/modes/OmegaGoldenSnapshot.ts

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { OmegaGoldenResult } from "./OmegaGoldenRunner";
import { getActiveLLMBackend } from "../LLMRouter";
import { getOpenAIModel } from "../openai/OpenAIConfig";
import { getGeminiModel } from "../config/GeminiConfig";

const GOLDENS_DIR = join(process.cwd(), "spine", "llm", "modes", "goldens");
const SNAPSHOT_FILE = join(GOLDENS_DIR, "omega_goldens.v1.snap.json");
const META_FILE = join(GOLDENS_DIR, "omega_goldens.v1.meta.json");

export interface GoldenSnapshotMeta {
  version: string;
  createdAtIso: string;
  backend: string | null;
  model: string | null;
  note: string;
}

/**
 * Load snapshot results from disk
 */
export async function loadGoldenSnapshot(): Promise<OmegaGoldenResult[]> {
  try {
    const content = await readFile(SNAPSHOT_FILE, "utf-8");
    return JSON.parse(content) as OmegaGoldenResult[];
  } catch {
    return [];
  }
}

/**
 * Load snapshot metadata
 */
export async function loadGoldenMeta(): Promise<GoldenSnapshotMeta | null> {
  try {
    const content = await readFile(META_FILE, "utf-8");
    return JSON.parse(content) as GoldenSnapshotMeta;
  } catch {
    return null;
  }
}

/**
 * Save snapshot results and metadata
 */
export async function saveGoldenSnapshot(
  results: OmegaGoldenResult[]
): Promise<void> {
  const backend = getActiveLLMBackend();
  let model: string | null = null;

  if (backend === "openai") {
    model = getOpenAIModel();
  } else if (backend === "gemini") {
    model = getGeminiModel();
  }

  const meta: GoldenSnapshotMeta = {
    version: "1.0.0",
    createdAtIso: new Date().toISOString(),
    backend: backend ?? null,
    model: model ?? null,
    note: "This file is auto-generated. Do not edit manually.",
  };

  await writeFile(SNAPSHOT_FILE, JSON.stringify(results, null, 2) + "\n", "utf-8");
  await writeFile(META_FILE, JSON.stringify(meta, null, 2) + "\n", "utf-8");
}




































