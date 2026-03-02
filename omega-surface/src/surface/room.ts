import type { RoomSurface, RoomPreset } from './types.js';
import type { OntologyLayer } from '../ontology/types.js';

const DEFAULT_LAYERS: OntologyLayer[] = [
  'structure',
  'constraints',
  'uncertainty',
  'assumptions',
];

/**
 * Create a Room surface with default human controls.
 */
export function createRoomSurface(
  name: string,
  options: {
    layers?: OntologyLayer[];
    presets?: RoomPreset[];
    inspector?: boolean;
    freeze?: boolean;
    annotate?: boolean;
    challenge?: boolean;
  } = {}
): RoomSurface {
  return {
    type: 'room',
    name,
    layers: options.layers ?? DEFAULT_LAYERS,
    presets: options.presets ?? [],
    inspector: options.inspector ?? true,
    execution: false,
    human_controls: {
      freeze: options.freeze ?? true,
      annotate: options.annotate ?? true,
      challenge: options.challenge ?? true,
    },
  };
}
