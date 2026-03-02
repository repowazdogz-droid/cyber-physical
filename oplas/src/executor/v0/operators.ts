/**
 * DSL v0 Operator Semantics
 * 
 * Deterministic implementations of all 5 operators.
 * 
 * Version: 1.0.0
 */

import { RuntimeValue, Grid, Mask, ObjSet, ExecError, ExecErrorCode, RuntimeEnv } from './types';
import { DSLType, CoordRel, CoordAbs } from '../../dsl/v0/types';
import { CanonicalRepresentation, Node } from '../../contracts/types/Repr';

/**
 * Validates value type.
 */
function checkType(value: RuntimeValue, expected: DSLType): boolean {
  switch (expected) {
    case DSLType.Grid:
      return Array.isArray(value) && Array.isArray(value[0]) && typeof value[0][0] === 'number';
    case DSLType.Mask:
      return Array.isArray(value) && Array.isArray(value[0]) && typeof value[0][0] === 'boolean';
    case DSLType.ObjSet:
      return Array.isArray(value) && value.every(v => typeof v === 'string');
    case DSLType.Color:
    case DSLType.Int:
      return typeof value === 'number' && Number.isInteger(value);
    case DSLType.Bool:
      return typeof value === 'boolean';
    case DSLType.CoordRel:
      return typeof value === 'object' && value !== null && 'anchor' in value && 'dy' in value && 'dx' in value;
    case DSLType.CoordAbs:
      return typeof value === 'object' && value !== null && 'y' in value && 'x' in value;
    case DSLType.Repr:
      return typeof value === 'object' && value !== null && 'nodes' in value && 'edges' in value;
    default:
      return false;
  }
}

/**
 * select_components(repr, predicate) -> ObjSet
 * 
 * Selects components from representation based on predicate.
 * For v0, predicate is simplified to boolean (select all if true).
 */
export function selectComponents(env: RuntimeEnv, repr: CanonicalRepresentation, predicate: RuntimeValue): { ok: boolean; value?: ObjSet; error?: ExecError } {
  if (!checkType(predicate, DSLType.Bool)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.Bool, got: typeof predicate }
      }
    };
  }

  if (predicate !== true) {
    // For v0, only true predicate is supported (select all components)
    return {
      ok: false,
      error: {
        code: ExecErrorCode.INVALID_PREDICATE,
        details: { message: 'Only true predicate supported in v0' }
      }
    };
  }

  // Select all component nodes (sorted by canonical order)
  const components = repr.nodes
    .filter(node => node.type === 'component')
    .map(node => node.id)
    .sort(); // Canonical order

  env.metrics.objs_selected += components.length;

  return {
    ok: true,
    value: components
  };
}

/**
 * mask_from_objects(repr, objs) -> Mask
 * 
 * Builds boolean grid marking all cells belonging to selected components.
 */
export function maskFromObjects(env: RuntimeEnv, repr: CanonicalRepresentation, objs: ObjSet): { ok: boolean; value?: Mask; error?: ExecError } {
  if (!checkType(objs, DSLType.ObjSet)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.ObjSet, got: typeof objs }
      }
    };
  }

  const grid = env.inputs.grid;
  const height = grid.length;
  const width = grid[0]?.length || 0;

  // Create mask
  const mask: Mask = Array(height).fill(null).map(() => Array(width).fill(false));

  // Get component nodes from repr
  const componentMap = new Map<string, Node>();
  for (const node of repr.nodes) {
    if (node.type === 'component') {
      componentMap.set(node.id, node);
    }
  }

  // Mark cells belonging to selected components
  // For v0, we need to reconstruct component cells from repr attrs
  // This is simplified - in practice, we'd store cell lists in repr or recompute deterministically
  let cellsProcessed = 0;

  for (const objId of objs) {
    const node = componentMap.get(objId);
    if (!node) continue;

    const attrs = node.attrs as any;
    const bbox = attrs.bbox;
    if (!bbox) continue;

    // Mark all cells in bbox (simplified - assumes rectangular components)
    for (let y = bbox.y_min; y <= bbox.y_max; y++) {
      for (let x = bbox.x_min; x <= bbox.x_max; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          mask[y][x] = true;
          cellsProcessed++;
        }
      }
    }
  }

  env.metrics.cells_processed += cellsProcessed;

  return {
    ok: true,
    value: mask
  };
}

/**
 * recolor(grid, mask, from?, to) -> Grid
 * 
 * Recolors masked cells.
 */
export function recolor(env: RuntimeEnv, grid: Grid, mask: Mask, from: RuntimeValue | null, to: RuntimeValue): { ok: boolean; value?: Grid; error?: ExecError } {
  if (!checkType(grid, DSLType.Grid)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.Grid, got: typeof grid }
      }
    };
  }

  if (!checkType(mask, DSLType.Mask)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.Mask, got: typeof mask }
      }
    };
  }

  if (!checkType(to, DSLType.Color)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.Color, got: typeof to }
      }
    };
  }

  const fromColor = from !== null && checkType(from, DSLType.Color) ? (from as number) : null;
  const toColor = to as number;

  const height = grid.length;
  const width = grid[0]?.length || 0;

  // Copy grid
  const result: Grid = grid.map(row => [...row]);

  let cellsProcessed = 0;

  // Recolor masked cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y]?.[x]) {
        if (fromColor === null || result[y][x] === fromColor) {
          result[y][x] = toColor;
          cellsProcessed++;
        }
      }
    }
  }

  env.metrics.cells_processed += cellsProcessed;

  return {
    ok: true,
    value: result
  };
}

/**
 * crop_to_bbox(grid, objs|mask) -> Grid
 * 
 * Crops grid to bounding box of objects or mask.
 */
export function cropToBbox(env: RuntimeEnv, grid: Grid, selection: ObjSet | Mask): { ok: boolean; value?: Grid; error?: ExecError } {
  if (!checkType(grid, DSLType.Grid)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.Grid, got: typeof grid }
      }
    };
  }

  let yMin = Infinity;
  let yMax = -Infinity;
  let xMin = Infinity;
  let xMax = -Infinity;
  let hasSelection = false;

  if (checkType(selection, DSLType.ObjSet)) {
    // Compute bbox from object set
    const objs = selection as ObjSet;
    const repr = env.repr;

    for (const objId of objs) {
      const node = repr.nodes.find(n => n.id === objId);
      if (!node || node.type !== 'component') continue;

      const attrs = node.attrs as any;
      const bbox = attrs.bbox;
      if (!bbox) continue;

      yMin = Math.min(yMin, bbox.y_min);
      yMax = Math.max(yMax, bbox.y_max);
      xMin = Math.min(xMin, bbox.x_min);
      xMax = Math.max(xMax, bbox.x_max);
      hasSelection = true;
    }
  } else if (checkType(selection, DSLType.Mask)) {
    // Compute bbox from mask
    const mask = selection as Mask;
    const height = mask.length;
    const width = mask[0]?.length || 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y]?.[x]) {
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          hasSelection = true;
        }
      }
    }
  } else {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: 'ObjSet or Mask', got: typeof selection }
      }
    };
  }

  if (!hasSelection) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.EMPTY_SELECTION,
        details: { message: 'Empty selection for crop' }
      }
    };
  }

  // Crop grid (inclusive bbox)
  const result: Grid = [];
  for (let y = yMin; y <= yMax; y++) {
    const row: number[] = [];
    for (let x = xMin; x <= xMax; x++) {
      row.push(grid[y]?.[x] ?? 0);
    }
    result.push(row);
  }

  return {
    ok: true,
    value: result
  };
}

/**
 * paste_at(base, patch, at) -> Grid
 * 
 * Pastes patch into base at coordinate.
 */
export function pasteAt(env: RuntimeEnv, base: Grid, patch: Grid, at: RuntimeValue): { ok: boolean; value?: Grid; error?: ExecError } {
  if (!checkType(base, DSLType.Grid)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.Grid, got: typeof base }
      }
    };
  }

  if (!checkType(patch, DSLType.Grid)) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: DSLType.Grid, got: typeof patch }
      }
    };
  }

  const baseHeight = base.length;
  const baseWidth = base[0]?.length || 0;
  const patchHeight = patch.length;
  const patchWidth = patch[0]?.length || 0;

  // Resolve coordinate
  let pasteY: number;
  let pasteX: number;

  if (checkType(at, DSLType.CoordAbs)) {
    const coord = at as CoordAbs;
    pasteY = coord.y;
    pasteX = coord.x;
  } else if (checkType(at, DSLType.CoordRel)) {
    const coord = at as CoordRel;
    // Compute anchor location
    let anchorY: number;
    let anchorX: number;

    switch (coord.anchor) {
      case 'top_left':
        anchorY = 0;
        anchorX = 0;
        break;
      case 'top_right':
        anchorY = 0;
        anchorX = baseWidth - 1;
        break;
      case 'bottom_left':
        anchorY = baseHeight - 1;
        anchorX = 0;
        break;
      case 'bottom_right':
        anchorY = baseHeight - 1;
        anchorX = baseWidth - 1;
        break;
      case 'center':
        anchorY = Math.floor(baseHeight / 2);
        anchorX = Math.floor(baseWidth / 2);
        break;
      default:
        return {
          ok: false,
          error: {
            code: ExecErrorCode.INVALID_INPUT,
            details: { message: `Unknown anchor: ${coord.anchor}` }
          }
        };
    }

    pasteY = anchorY + coord.dy;
    pasteX = anchorX + coord.dx;
  } else {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.TYPE_MISMATCH,
        details: { expected: 'CoordRel or CoordAbs', got: typeof at }
      }
    };
  }

  // Check bounds (v0: fail if any cell would go out of bounds)
  if (pasteY < 0 || pasteY + patchHeight > baseHeight ||
      pasteX < 0 || pasteX + patchWidth > baseWidth) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.OUT_OF_BOUNDS_PASTE,
        details: {
          pasteY,
          pasteX,
          patchHeight,
          patchWidth,
          baseHeight,
          baseWidth
        }
      }
    };
  }

  // Copy base
  const result: Grid = base.map(row => [...row]);

  // Paste patch (overwrite)
  for (let py = 0; py < patchHeight; py++) {
    for (let px = 0; px < patchWidth; px++) {
      result[pasteY + py][pasteX + px] = patch[py][px];
    }
  }

  env.metrics.cells_processed += patchHeight * patchWidth;

  return {
    ok: true,
    value: result
  };
}

