// spine/llm/modes/OmegaCompare.ts

import { generateText } from "../LLMRouter";
import type { OmegaMode } from "./OmegaModes";
import type { OmegaMeta } from "./OmegaMeta";
import { hashText } from "./llmRunUtils";

export type OmegaCompareResult = {
  mode: OmegaMode;
  text: string;
  omegaMeta?: OmegaMeta;
};

export type OmegaCompareOutput = {
  inputHash: string;
  outputs: Record<OmegaMode, OmegaCompareResult>;
  createdAtIso: string;
};

/**
 * Run the same input through all five Omega modes
 */
export async function compareOmegaModes(
  prompt: string,
  maxOutputChars?: number
): Promise<OmegaCompareOutput> {
  const modes: OmegaMode[] = ["v37", "V", "B", "R", "G"];
  const outputs: Record<OmegaMode, OmegaCompareResult> = {} as any;

  for (const mode of modes) {
    const result = await generateText({
      user: prompt,
      maxOutputChars: maxOutputChars ?? 900,
      omega: {
        mode,
        retryOnAuditFailure: true,
      },
    });

    if (!result.ok || !result.text) {
      throw new Error(
        `Omega mode ${mode} failed: ${result.error || "Unknown error"}`
      );
    }

    outputs[mode] = {
      mode,
      text: result.text,
      omegaMeta: result.omegaMeta,
    };
  }

  return {
    inputHash: hashText(prompt),
    outputs,
    createdAtIso: new Date().toISOString(),
  };
}

/**
 * Count sections in text (simple heuristic: lines starting with uppercase words)
 */
export function countSections(text: string): number {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines that look like section headers (all caps, or title case followed by colon)
    if (
      /^[A-Z][A-Z\s]+:/.test(trimmed) ||
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:/.test(trimmed)
    ) {
      count++;
    }
  }
  return count;
}

/**
 * Generate structured diff summary between two mode outputs
 */
export function generateDiffSummary(
  modeA: OmegaMode,
  resultA: OmegaCompareResult,
  modeB: OmegaMode,
  resultB: OmegaCompareResult
): string {
  const lenA = resultA.text.length;
  const lenB = resultB.text.length;
  const lenDiff = lenB - lenA;
  const lenPercent = lenA > 0 ? ((lenDiff / lenA) * 100).toFixed(0) : "0";

  const sectionsA = countSections(resultA.text);
  const sectionsB = countSections(resultB.text);
  const sectionsDiff = sectionsB - sectionsA;

  const violationsA = resultA.omegaMeta?.audit?.violations?.length ?? 0;
  const violationsB = resultB.omegaMeta?.audit?.violations?.length ?? 0;

  const retryA = resultA.omegaMeta?.retry?.attempted ?? false;
  const retryB = resultB.omegaMeta?.retry?.attempted ?? false;

  const parts: string[] = [];

  // Length comparison
  if (lenDiff > 0) {
    parts.push(`+${lenPercent}% length`);
  } else if (lenDiff < 0) {
    parts.push(`${lenPercent}% length`);
  }

  // Section comparison
  if (sectionsDiff > 0) {
    parts.push(`+${sectionsDiff} sections`);
  } else if (sectionsDiff < 0) {
    parts.push(`${sectionsDiff} sections`);
  }

  // Violations comparison
  if (violationsA === 0 && violationsB > 0) {
    parts.push(`violations introduced`);
  } else if (violationsA > 0 && violationsB === 0) {
    parts.push(`violations removed`);
  } else if (violationsA !== violationsB) {
    parts.push(`violations changed`);
  }

  // Retry comparison
  if (!retryA && retryB) {
    parts.push(`retry occurred`);
  } else if (retryA && !retryB) {
    parts.push(`no retry needed`);
  }

  // Special detection for structured outputs
  if (resultB.text.includes("Execution Steps") || resultB.text.includes("Understood Intent")) {
    parts.push(`steps detected`);
  }
  if (resultB.text.includes("Variations") || resultB.text.includes("Creative Levers")) {
    parts.push(`variants detected`);
  }
  if (resultA.text.match(/you should|you must|the best/i) && !resultB.text.match(/you should|you must|the best/i)) {
    parts.push(`judgment language removed`);
  }

  return parts.length > 0 ? parts.join(", ") : "minimal differences";
}




































