// spine/sim/listFaultEpisodes.ts

import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Lists fault episode IDs found in artifacts/fault-episodes/
 * Returns sorted list (lexicographically: episode_001, episode_002, etc.)
 * Returns empty array if directory doesn't exist (ENOENT).
 */
export async function listFaultEpisodeIds(): Promise<string[]> {
  const baseDir = path.join(process.cwd(), "artifacts", "fault-episodes");

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch (err: any) {
    // If the folder doesn't exist yet, treat as "no episodes"
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

