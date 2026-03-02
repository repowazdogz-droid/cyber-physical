/**
 * Grid 2D Parser
 * 
 * Deterministic parser for grid_2d domain.
 * NO LLM in parse path. Pure deterministic logic.
 * 
 * Version: 1.0.0
 */

import { RawGridInput, ComponentAttributes, GridMetadata } from './types';
import { CanonicalRepresentation, Node, Edge, Value } from '../../contracts/types/Repr';
import { Domain } from '../../contracts/enums/Domains';

const PARSER_VERSION = '1.0.0';
const REPR_VERSION = '1.0.0';

/**
 * Parse result.
 */
export interface ParseResult {
  ok: boolean;
  repr?: CanonicalRepresentation;
  error?: string;
}

/**
 * Cell position.
 */
interface CellPos {
  y: number;
  x: number;
}

/**
 * Connected component.
 */
interface Component {
  cells: CellPos[];
  color: number;
}

/**
 * Validates raw grid input.
 */
function validateGrid(input: RawGridInput): { ok: boolean; error?: string } {
  const { cells } = input;

  if (!Array.isArray(cells) || cells.length === 0) {
    return { ok: false, error: 'cells must be non-empty array' };
  }

  const height = cells.length;
  const width = cells[0]?.length || 0;

  if (width === 0) {
    return { ok: false, error: 'grid must have at least one column' };
  }

  // Check for ragged rows
  for (let y = 0; y < height; y++) {
    if (!Array.isArray(cells[y])) {
      return { ok: false, error: `row ${y} is not an array` };
    }
    if (cells[y].length !== width) {
      return { ok: false, error: `row ${y} has inconsistent width` };
    }
  }

  // Check for floats and palette bounds
  const paletteSize = input.palette_size ?? 0;
  let maxValue = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = cells[y][x];
      
      if (typeof value !== 'number') {
        return { ok: false, error: `cell (${y},${x}) is not a number` };
      }
      
      if (!Number.isInteger(value)) {
        return { ok: false, error: `cell (${y},${x}) is not an integer` };
      }
      
      if (value < 0) {
        return { ok: false, error: `cell (${y},${x}) is negative` };
      }

      maxValue = Math.max(maxValue, value);
    }
  }

  if (paletteSize > 0 && maxValue >= paletteSize) {
    return { ok: false, error: `cell value ${maxValue} exceeds palette size ${paletteSize}` };
  }

  return { ok: true };
}

/**
 * Computes connected components using 4-neighborhood.
 */
function computeComponents4(cells: number[][]): Component[] {
  const height = cells.length;
  const width = cells[0].length;
  const visited = new Set<string>();
  const components: Component[] = [];

  function getKey(y: number, x: number): string {
    return `${y},${x}`;
  }

  function dfs(y: number, x: number, color: number, component: CellPos[]): void {
    const key = getKey(y, x);
    if (visited.has(key)) return;
    if (y < 0 || y >= height || x < 0 || x >= width) return;
    if (cells[y][x] !== color) return;

    visited.add(key);
    component.push({ y, x });

    // 4-neighborhood: up, down, left, right
    dfs(y - 1, x, color, component);
    dfs(y + 1, x, color, component);
    dfs(y, x - 1, color, component);
    dfs(y, x + 1, color, component);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = getKey(y, x);
      if (!visited.has(key)) {
        const color = cells[y][x];
        const component: CellPos[] = [];
        dfs(y, x, color, component);
        components.push({ cells: component, color });
      }
    }
  }

  return components;
}

/**
 * Computes component attributes.
 */
function computeComponentAttributes(component: Component): ComponentAttributes {
  const { cells, color } = component;

  if (cells.length === 0) {
    throw new Error('Empty component');
  }

  let yMin = cells[0].y;
  let yMax = cells[0].y;
  let xMin = cells[0].x;
  let xMax = cells[0].x;

  const colorCounts = new Map<number, number>();
  colorCounts.set(color, cells.length);

  for (const cell of cells) {
    yMin = Math.min(yMin, cell.y);
    yMax = Math.max(yMax, cell.y);
    xMin = Math.min(xMin, cell.x);
    xMax = Math.max(xMax, cell.x);
  }

  // Compute centroid (integer if possible)
  const sumY = cells.reduce((sum, c) => sum + c.y, 0);
  const sumX = cells.reduce((sum, c) => sum + c.x, 0);
  const centroidY = Math.round(sumY / cells.length);
  const centroidX = Math.round(sumX / cells.length);

  // Color histogram (sorted by color)
  const histogram = Array.from(colorCounts.entries())
    .map(([c, count]) => ({ color: c, count }))
    .sort((a, b) => a.color - b.color);

  // Compute perimeter (4-neighborhood: count edges on boundary)
  let perimeter = 0;
  const cellSet = new Set(cells.map(c => `${c.y},${c.x}`));
  
  for (const cell of cells) {
    const neighbors = [
      { y: cell.y - 1, x: cell.x },
      { y: cell.y + 1, x: cell.x },
      { y: cell.y, x: cell.x - 1 },
      { y: cell.y, x: cell.x + 1 }
    ];
    
    for (const n of neighbors) {
      if (!cellSet.has(`${n.y},${n.x}`)) {
        perimeter++;
      }
    }
  }

  return {
    bbox: {
      y_min: yMin,
      x_min: xMin,
      y_max: yMax,
      x_max: xMax
    },
    area: cells.length,
    centroid: {
      y: centroidY,
      x: centroidX
    },
    color_histogram: histogram,
    perimeter
  };
}

/**
 * Computes adjacency relations between components.
 */
function computeAdjacency(components: Component[]): Array<{ src: number; dst: number }> {
  const adjacencies: Array<{ src: number; dst: number }> = [];
  const componentSets = components.map(comp => 
    new Set(comp.cells.map(c => `${c.y},${c.x}`))
  );

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const setI = componentSets[i];
      const setJ = componentSets[j];

      // Check if components are adjacent (touching edges)
      for (const cell of components[i].cells) {
        const neighbors = [
          { y: cell.y - 1, x: cell.x },
          { y: cell.y + 1, x: cell.x },
          { y: cell.y, x: cell.x - 1 },
          { y: cell.y, x: cell.x + 1 }
        ];

        for (const n of neighbors) {
          if (setJ.has(`${n.y},${n.x}`)) {
            adjacencies.push({ src: i, dst: j });
            break;
          }
        }
      }
    }
  }

  return adjacencies;
}

/**
 * Computes containment relations.
 */
function computeContainment(components: Component[], gridHeight: number, gridWidth: number): Array<{ child: number; parent: number | 'grid' }> {
  const containments: Array<{ child: number; parent: number | 'grid' }> = [];

  for (let i = 0; i < components.length; i++) {
    const attrsI = computeComponentAttributes(components[i]);
    const bboxI = attrsI.bbox;

    // Check if contained in grid
    if (bboxI.y_min === 0 && bboxI.x_min === 0 && 
        bboxI.y_max === gridHeight - 1 && bboxI.x_max === gridWidth - 1) {
      containments.push({ child: i, parent: 'grid' });
    }

    // Check if contained in another component
    for (let j = 0; j < components.length; j++) {
      if (i === j) continue;
      
      const attrsJ = computeComponentAttributes(components[j]);
      const bboxJ = attrsJ.bbox;

      // Bbox containment
      if (bboxI.y_min >= bboxJ.y_min && bboxI.y_max <= bboxJ.y_max &&
          bboxI.x_min >= bboxJ.x_min && bboxI.x_max <= bboxJ.x_max) {
        // Check pixel containment
        const setJ = new Set(components[j].cells.map(c => `${c.y},${c.x}`));
        let allContained = true;
        
        for (const cell of components[i].cells) {
          if (!setJ.has(`${cell.y},${cell.x}`)) {
            allContained = false;
            break;
          }
        }

        if (allContained) {
          containments.push({ child: i, parent: j });
        }
      }
    }
  }

  return containments;
}

/**
 * Computes alignment relations.
 */
function computeAlignment(components: Component[]): Array<{ src: number; dst: number; axis: 'x' | 'y' }> {
  const alignments: Array<{ src: number; dst: number; axis: 'x' | 'y' }> = [];

  for (let i = 0; i < components.length; i++) {
    const attrsI = computeComponentAttributes(components[i]);
    const bboxI = attrsI.bbox;

    for (let j = i + 1; j < components.length; j++) {
      const attrsJ = computeComponentAttributes(components[j]);
      const bboxJ = attrsJ.bbox;

      // Check x-axis alignment (shared x_min or x_max)
      if (bboxI.x_min === bboxJ.x_min || bboxI.x_max === bboxJ.x_max) {
        alignments.push({ src: i, dst: j, axis: 'x' });
      }

      // Check y-axis alignment (shared y_min or y_max)
      if (bboxI.y_min === bboxJ.y_min || bboxI.y_max === bboxJ.y_max) {
        alignments.push({ src: i, dst: j, axis: 'y' });
      }
    }
  }

  return alignments;
}

/**
 * Parses raw grid input into canonical representation.
 */
export function parseGrid(input: RawGridInput): ParseResult {
  // Validate
  const validation = validateGrid(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const { cells } = input;
  const height = cells.length;
  const width = cells[0].length;
  const paletteSize = input.palette_size ?? Math.max(...cells.flat()) + 1;

  // Compute components (4-neighborhood)
  const components = computeComponents4(cells);

  // Create grid node
  const gridNode: Node = {
    id: 'grid', // Will be reassigned by canonicalizer
    type: 'grid',
    attrs: {
      height,
      width,
      palette_size: paletteSize,
      neighborhood: 4
    }
  };

  // Create component nodes
  const componentNodes: Node[] = components.map((comp, idx) => {
    const attrs = computeComponentAttributes(comp);
    return {
      id: `comp_${idx}`, // Will be reassigned by canonicalizer
      type: 'component',
      attrs: {
        bbox: attrs.bbox,
        area: attrs.area,
        centroid: attrs.centroid,
        color_histogram: attrs.color_histogram,
        perimeter: attrs.perimeter
      } as Value
    };
  });

  // Create edges
  const edges: Edge[] = [];

  // Grid → components
  for (let i = 0; i < components.length; i++) {
    edges.push({
      src: 'grid',
      dst: `comp_${i}`,
      type: 'has_component',
      attrs: {}
    });
  }

  // Adjacency
  const adjacencies = computeAdjacency(components);
  for (const adj of adjacencies) {
    edges.push({
      src: `comp_${adj.src}`,
      dst: `comp_${adj.dst}`,
      type: 'adjacent_to',
      attrs: {}
    });
    // Bidirectional
    edges.push({
      src: `comp_${adj.dst}`,
      dst: `comp_${adj.src}`,
      type: 'adjacent_to',
      attrs: {}
    });
  }

  // Containment
  const containments = computeContainment(components, height, width);
  for (const cont of containments) {
    const parentId = cont.parent === 'grid' ? 'grid' : `comp_${cont.parent}`;
    edges.push({
      src: parentId,
      dst: `comp_${cont.child}`,
      type: 'contained_in',
      attrs: {}
    });
  }

  // Alignment
  const alignments = computeAlignment(components);
  for (const align of alignments) {
    edges.push({
      src: `comp_${align.src}`,
      dst: `comp_${align.dst}`,
      type: 'aligned_with',
      attrs: { axis: align.axis } as Value
    });
    // Bidirectional
    edges.push({
      src: `comp_${align.dst}`,
      dst: `comp_${align.src}`,
      type: 'aligned_with',
      attrs: { axis: align.axis } as Value
    });
  }

  // Create representation (not yet canonicalized)
  const repr: CanonicalRepresentation = {
    repr_id: '', // Will be set by canonicalizer
    schema_version: REPR_VERSION,
    domain: Domain.GRID_2D,
    nodes: [gridNode, ...componentNodes],
    edges,
    globals: {
      height,
      width,
      palette_size: paletteSize,
      neighborhood: 4
    } as Value,
    provenance: {
      parser_version: PARSER_VERSION,
      created_at_iso: new Date().toISOString()
    }
  };

  return { ok: true, repr };
}

