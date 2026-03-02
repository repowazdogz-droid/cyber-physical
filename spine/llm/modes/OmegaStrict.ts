// spine/llm/modes/OmegaStrict.ts

/**
 * Checks if Omega strict mode is enabled via environment variable.
 * Strict mode enforces audit compliance: if audit fails after retry,
 * the router returns an error instead of non-compliant output.
 */
export function isOmegaStrictEnabled(): boolean {
  return String(process.env.OMEGA_STRICT || "").toLowerCase() === "true";
}




































