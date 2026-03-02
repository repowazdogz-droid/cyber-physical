import type { TerminalSurface, TerminalStage } from './types.js';

/**
 * Create a Terminal surface with default integrity and human controls.
 */
export function createTerminalSurface(
  name: string,
  stages: TerminalStage[],
  options: {
    hash_chain?: boolean;
    post_hoc_verification?: boolean;
    citation_check?: boolean;
    tamper_detection?: boolean;
    freeze?: boolean;
    revise?: boolean;
    export?: boolean;
  } = {}
): TerminalSurface {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  return {
    type: 'terminal',
    name,
    stages: sorted,
    integrity: {
      hash_chain: options.hash_chain ?? true,
      post_hoc_verification: options.post_hoc_verification ?? true,
      citation_check: options.citation_check ?? true,
      tamper_detection: options.tamper_detection ?? true,
    },
    human_controls: {
      freeze: options.freeze ?? true,
      revise: options.revise ?? true,
      export: options.export ?? true,
    },
  };
}
