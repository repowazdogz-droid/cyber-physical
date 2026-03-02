/**
 * Room — spatial, layered, inspect-only. Human-in-the-loop locus.
 * Terminal — pipeline, stages, verification.
 */

import type { OntologyLayer } from '../ontology/types.js';

export interface RoomPreset {
  id: string;
  label: string;
  visible_layers: OntologyLayer[];
  description: string;
}

export interface RoomSurface {
  type: 'room';
  name: string;
  layers: OntologyLayer[];
  presets: RoomPreset[];
  inspector: boolean;
  execution: false;
  human_controls: {
    freeze: boolean;
    annotate: boolean;
    challenge: boolean;
  };
}

export interface TerminalStage {
  id: string;
  label: string;
  order: number;
  type: 'generation' | 'verification' | 'synthesis' | 'export';
  deterministic: boolean;
}

export interface TerminalSurface {
  type: 'terminal';
  name: string;
  stages: TerminalStage[];
  integrity: {
    hash_chain: boolean;
    post_hoc_verification: boolean;
    citation_check: boolean;
    tamper_detection: boolean;
  };
  human_controls: {
    freeze: boolean;
    revise: boolean;
    export: boolean;
  };
}
