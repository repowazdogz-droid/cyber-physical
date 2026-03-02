/**
 * Perturbations
 * 
 * Grammar-bounded, schema-preserving perturbations for Tier 4 counterexample probing.
 * 
 * Version: 1.0.0
 */

import { Grid } from '../../executor/v0/types';
import { CanonicalRepresentation, Node } from '../../contracts/types/Repr';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';

/**
 * Perturbation type.
 */
export enum PerturbationType {
  ADD_DISTRACTOR = 'ADD_DISTRACTOR',
  DUPLICATE_COMPONENT = 'DUPLICATE_COMPONENT'
}

/**
 * Perturbation result.
 */
export interface Perturbation {
  /** Perturbation type */
  type: PerturbationType;
  /** Perturbation ID (deterministic) */
  perturbation_id: string;
  /** Perturbed grid */
  perturbed_grid: Grid;
  /** Mask of touched cells */
  touched_mask: boolean[][];
  /** Details */
  details: Record<string, any>;
}

/**
 * Safety check result.
 */
export interface SafetyCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Component shape library (tiny).
 */
const COMPONENT_SHAPES = [
  { width: 1, height: 1 }, // 1x1
  { width: 1, height: 2 }, // 1x2
  { width: 2, height: 1 }, // 2x1
  { width: 2, height: 2 }  // 2x2
];

/**
 * Checks if a perturbation is safe.
 */
export function checkPerturbationSafety(
  originalGrid: Grid,
  perturbedGrid: Grid
): SafetyCheck {
  // Check rectangular
  if (perturbedGrid.length === 0) {
    return { ok: false, reason: 'empty_grid' };
  }

  const width = perturbedGrid[0].length;
  for (const row of perturbedGrid) {
    if (row.length !== width) {
      return { ok: false, reason: 'ragged_rows' };
    }
  }

  // Check colors are ints (already enforced by Grid type)
  // Check edit distance
  const originalCells = originalGrid.length * (originalGrid[0]?.length || 0);
  const perturbedCells = perturbedGrid.length * (perturbedGrid[0]?.length || 0);
  const addedCells = perturbedCells - originalCells;

  if (addedCells > 4) {
    return { ok: false, reason: 'edit_distance_exceeded' };
  }

  return { ok: true };
}

/**
 * Finds empty regions in grid.
 */
function findEmptyRegions(grid: Grid, minSize: number = 1): Array<{ y: number; x: number; width: number; height: number }> {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const regions: Array<{ y: number; x: number; width: number; height: number }> = [];

  // Simple scan for empty cells (background = 0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 0) {
        // Check if we can place a shape here
        for (const shape of COMPONENT_SHAPES) {
          if (y + shape.height <= height && x + shape.width <= width) {
            let canPlace = true;
            for (let dy = 0; dy < shape.height; dy++) {
              for (let dx = 0; dx < shape.width; dx++) {
                if (grid[y + dy][x + dx] !== 0) {
                  canPlace = false;
                  break;
                }
              }
              if (!canPlace) break;
            }
            if (canPlace) {
              regions.push({ y, x, width: shape.width, height: shape.height });
            }
          }
        }
      }
    }
  }

  return regions;
}

/**
 * Generates perturbation ID deterministically.
 */
function generatePerturbationId(repr_id: string, program_id: string, perturbationIndex: number): string {
  const seed = `${repr_id}:${program_id}:${perturbationIndex}`;
  return hashCanonical(seed).slice(0, 16);
}

/**
 * Selects perturbation type deterministically.
 */
function selectPerturbationType(perturbationId: string): PerturbationType {
  const hash = parseInt(perturbationId.slice(0, 8), 16) || 0;
  const types = Object.values(PerturbationType);
  return types[hash % types.length];
}

/**
 * Generates add distractor perturbation.
 */
function generateAddDistractor(
  grid: Grid,
  repr: CanonicalRepresentation,
  perturbationId: string
): Perturbation | null {
  const height = grid.length;
  const width = grid[0]?.length || 0;

  // Find empty regions
  const emptyRegions = findEmptyRegions(grid);
  if (emptyRegions.length === 0) {
    return null;
  }

  // Select region deterministically
  const hash = parseInt(perturbationId.slice(0, 8), 16) || 0;
  const regionIndex = hash % emptyRegions.length;
  const region = emptyRegions[regionIndex];

  // Select shape deterministically
  const shapeIndex = (hash >> 8) % COMPONENT_SHAPES.length;
  const shape = COMPONENT_SHAPES[shapeIndex];

  // Select color (prefer unused color, fallback to background+1)
  const usedColors = new Set<number>();
  for (const row of grid) {
    for (const cell of row) {
      usedColors.add(cell);
    }
  }

  let distractorColor = 0;
  for (let c = 0; c < 10; c++) {
    if (!usedColors.has(c)) {
      distractorColor = c;
      break;
    }
  }
  if (distractorColor === 0 && usedColors.has(0)) {
    distractorColor = Math.max(...Array.from(usedColors)) + 1;
  }

  // Create perturbed grid
  const perturbed: Grid = grid.map(row => [...row]);
  const touched: boolean[][] = grid.map(row => row.map(() => false));

  // Place distractor
  for (let dy = 0; dy < shape.height; dy++) {
    for (let dx = 0; dx < shape.width; dx++) {
      const y = region.y + dy;
      const x = region.x + dx;
      if (y < height && x < width) {
        perturbed[y][x] = distractorColor;
        touched[y][x] = true;
      }
    }
  }

  // Safety check
  const safety = checkPerturbationSafety(grid, perturbed);
  if (!safety.ok) {
    return null;
  }

  return {
    type: PerturbationType.ADD_DISTRACTOR,
    perturbation_id: perturbationId,
    perturbed_grid: perturbed,
    touched_mask: touched,
    details: {
      region: { y: region.y, x: region.x },
      shape,
      color: distractorColor
    }
  };
}

/**
 * Generates duplicate component perturbation.
 */
function generateDuplicateComponent(
  grid: Grid,
  repr: CanonicalRepresentation,
  perturbationId: string
): Perturbation | null {
  // Find component nodes (sorted by canonical order)
  const components = repr.nodes
    .filter(n => n.type === 'component')
    .sort((a, b) => a.id.localeCompare(b.id));

  if (components.length === 0) {
    return null;
  }

  // Select component deterministically (pick smallest or k-th)
  const hash = parseInt(perturbationId.slice(0, 8), 16) || 0;
  const componentIndex = hash % components.length;
  const component = components[componentIndex];

  const attrs = component.attrs as any;
  const bbox = attrs.bbox;
  if (!bbox) {
    return null;
  }

  // Extract component cells (simplified: use bbox)
  const componentHeight = bbox.y_max - bbox.y_min + 1;
  const componentWidth = bbox.x_max - bbox.x_min + 1;

  // Find empty region large enough
  const emptyRegions = findEmptyRegions(grid, componentWidth * componentHeight);
  if (emptyRegions.length === 0) {
    return null;
  }

  // Select placement deterministically
  const regionIndex = (hash >> 8) % emptyRegions.length;
  const region = emptyRegions[regionIndex];

  // Extract component color (from histogram or grid)
  const gridHeight = grid.length;
  const gridWidth = grid[0]?.length || 0;
  let componentColor = 0;
  if (bbox.y_min >= 0 && bbox.y_min < gridHeight && bbox.x_min >= 0 && bbox.x_min < gridWidth) {
    componentColor = grid[bbox.y_min][bbox.x_min];
  }

  // Create perturbed grid
  const perturbed: Grid = grid.map(row => [...row]);
  const touched: boolean[][] = grid.map(row => row.map(() => false));

  // Copy component to new location
  for (let dy = 0; dy < componentHeight && region.y + dy < gridHeight; dy++) {
    for (let dx = 0; dx < componentWidth && region.x + dx < gridWidth; dx++) {
      const srcY = bbox.y_min + dy;
      const srcX = bbox.x_min + dx;
      const dstY = region.y + dy;
      const dstX = region.x + dx;

      if (srcY >= 0 && srcY < gridHeight && srcX >= 0 && srcX < gridWidth) {
        const cellValue = grid[srcY][srcX];
        if (dstY >= 0 && dstY < gridHeight && dstX >= 0 && dstX < gridWidth) {
          perturbed[dstY][dstX] = cellValue;
          touched[dstY][dstX] = true;
        }
      }
    }
  }

  // Safety check
  const safety = checkPerturbationSafety(grid, perturbed);
  if (!safety.ok) {
    return null;
  }

  return {
    type: PerturbationType.DUPLICATE_COMPONENT,
    perturbation_id: perturbationId,
    perturbed_grid: perturbed,
    touched_mask: touched,
    details: {
      source_component_id: component.id,
      source_bbox: bbox,
      target_region: { y: region.y, x: region.x },
      color: componentColor
    }
  };
}

/**
 * Generates perturbations deterministically.
 */
export function generatePerturbations(
  grid: Grid,
  repr: CanonicalRepresentation,
  program_id: string,
  count: number = 2
): Perturbation[] {
  const perturbations: Perturbation[] = [];

  for (let i = 0; i < count; i++) {
    const perturbationId = generatePerturbationId(repr.repr_id, program_id, i);
    const type = selectPerturbationType(perturbationId);

    let perturbation: Perturbation | null = null;

    switch (type) {
      case PerturbationType.ADD_DISTRACTOR:
        perturbation = generateAddDistractor(grid, repr, perturbationId);
        break;
      case PerturbationType.DUPLICATE_COMPONENT:
        perturbation = generateDuplicateComponent(grid, repr, perturbationId);
        break;
    }

    if (perturbation) {
      perturbations.push(perturbation);
    }
  }

  return perturbations;
}























