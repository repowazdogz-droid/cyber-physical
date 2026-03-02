/**
 * Invariance Tests
 * 
 * Level-0 invariance tests for generalization pressure.
 * 
 * Version: 1.0.0
 */

import { Grid } from '../../executor/v0/types';
import { Program } from '../../dsl/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { execute } from '../../executor/v0/Executor';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { FrameMode } from '../../contracts/enums/FrameModes';

/**
 * Generates deterministic palette permutation from repr_id.
 */
function generatePalettePermutation(repr_id: string, colors: number[]): Map<number, number> {
  const sortedColors = [...colors].sort((a, b) => a - b);
  const n = sortedColors.length;
  
  if (n < 2) {
    // No permutation needed
    return new Map(sortedColors.map(c => [c, c]));
  }

  // Generate deterministic rotation from hash
  const hash = parseInt(repr_id.slice(0, 8), 16) || 0;
  const rotation = hash % n;

  const permutation = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const sourceColor = sortedColors[i];
    const targetIndex = (i + rotation) % n;
    const targetColor = sortedColors[targetIndex];
    permutation.set(sourceColor, targetColor);
  }

  return permutation;
}

/**
 * Applies palette permutation to a grid.
 */
function applyPalettePermutation(grid: Grid, permutation: Map<number, number>): Grid {
  return grid.map(row =>
    row.map(cell => permutation.get(cell) ?? cell)
  );
}

/**
 * Extracts colors from a grid.
 */
function extractColors(grid: Grid): number[] {
  const colors = new Set<number>();
  for (const row of grid) {
    for (const cell of row) {
      colors.add(cell);
    }
  }
  return Array.from(colors);
}

/**
 * Tests palette permutation invariance.
 */
export function testPalettePermutation(
  program: Program,
  repr: CanonicalRepresentation,
  inputGrid: Grid,
  expectedOutputGrid: Grid
): { ok: boolean; error?: string; details?: Record<string, any> } {
  // Extract colors from input
  const colors = extractColors(inputGrid);
  
  if (colors.length < 2) {
    // Not enough colors to permute
    return {
      ok: true,
      details: { skipped: true, reason: 'insufficient_colors' }
    };
  }

  // Generate deterministic permutation
  const permutation = generatePalettePermutation(repr.repr_id, colors);

  // Apply permutation to input and expected output
  const permutedInput = applyPalettePermutation(inputGrid, permutation);
  const permutedExpected = applyPalettePermutation(expectedOutputGrid, permutation);

  // Parse and canonicalize permuted input -> repr
  const parseResult = parseGrid({ cells: permutedInput });
  if (!parseResult.ok || !parseResult.repr) {
    return {
      ok: false,
      error: 'Failed to parse permuted input',
      details: { parse_error: parseResult.error }
    };
  }

  let permutedRepr = canonicalizeGrid(parseResult.repr);
  permutedRepr.repr_id = hashCanonical(permutedRepr);

  // Execute program on permuted input
  const execResult = execute(program, permutedRepr, { grid: permutedInput });

  if (!execResult.ok || !execResult.outputs?.grid) {
    return {
      ok: false,
      error: 'Execution failed on permuted input',
      details: { exec_error: execResult.error }
    };
  }

  const permutedOutput = execResult.outputs.grid;

  // Compare permuted output to permuted expected
  if (permutedOutput.length !== permutedExpected.length) {
    return {
      ok: false,
      error: 'Output dimensions mismatch',
      details: {
        output_height: permutedOutput.length,
        expected_height: permutedExpected.length
      }
    };
  }

  for (let y = 0; y < permutedOutput.length; y++) {
    if (permutedOutput[y].length !== permutedExpected[y].length) {
      return {
        ok: false,
        error: `Row ${y} width mismatch`,
        details: {
          output_width: permutedOutput[y].length,
          expected_width: permutedExpected[y].length
        }
      };
    }

    for (let x = 0; x < permutedOutput[y].length; x++) {
      if (permutedOutput[y][x] !== permutedExpected[y][x]) {
        return {
          ok: false,
          error: `Cell (${y},${x}) mismatch`,
          details: {
            output_value: permutedOutput[y][x],
            expected_value: permutedExpected[y][x],
            position: { y, x }
          }
        };
      }
    }
  }

  return {
    ok: true,
    details: {
      permutation: Array.from(permutation.entries()),
      colors_permuted: colors.length
    }
  };
}

/**
 * Generates deterministic translation offset from repr_id.
 */
function generateTranslationOffset(repr_id: string): { dy: number; dx: number } {
  const hash = parseInt(repr_id.slice(0, 8), 16) || 0;
  const offsets = [
    { dy: -1, dx: 0 },
    { dy: 1, dx: 0 },
    { dy: 0, dx: -1 },
    { dy: 0, dx: 1 }
  ];
  return offsets[hash % offsets.length];
}

/**
 * Pads a grid with background color.
 */
function padGrid(grid: Grid, padding: number, background: number): Grid {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const paddedHeight = height + 2 * padding;
  const paddedWidth = width + 2 * padding;

  const padded: Grid = [];
  for (let y = 0; y < paddedHeight; y++) {
    const row: number[] = [];
    for (let x = 0; x < paddedWidth; x++) {
      if (y < padding || y >= height + padding || x < padding || x >= width + padding) {
        row.push(background);
      } else {
        row.push(grid[y - padding][x - padding]);
      }
    }
    padded.push(row);
  }

  return padded;
}

/**
 * Translates non-background content in a grid.
 */
function translateGrid(grid: Grid, dy: number, dx: number, background: number): Grid {
  const height = grid.length;
  const width = grid[0]?.length || 0;
  const translated: Grid = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const sourceY = y - dy;
      const sourceX = x - dx;
      
      if (sourceY >= 0 && sourceY < height && sourceX >= 0 && sourceX < width) {
        row.push(grid[sourceY][sourceX]);
      } else {
        row.push(background);
      }
    }
    translated.push(row);
  }

  return translated;
}

/**
 * Tests translation invariance.
 */
export function testTranslationInvariance(
  program: Program,
  repr: CanonicalRepresentation,
  inputGrid: Grid,
  expectedOutputGrid: Grid
): { ok: boolean; error?: string; details?: Record<string, any> } {
  // Check if program is eligible for translation test
  if (program.declared_frame !== FrameMode.RELATIVE) {
    return {
      ok: true,
      details: { skipped: true, reason: 'absolute_frame' }
    };
  }

  // Check if program uses absolute coordinates (would break translation)
  const astStr = JSON.stringify(program.ast);
  if (astStr.includes('CoordAbs') || astStr.includes('abs')) {
    return {
      ok: true,
      details: { skipped: true, reason: 'uses_absolute_coords' }
    };
  }

  // Generate deterministic translation offset
  const offset = generateTranslationOffset(repr.repr_id);
  const padding = 1;
  const background = 0;

  // Pad input grid
  const paddedInput = padGrid(inputGrid, padding, background);
  const paddedExpected = padGrid(expectedOutputGrid, padding, background);

  // Translate content
  const translatedInput = translateGrid(paddedInput, offset.dy, offset.dx, background);
  const translatedExpected = translateGrid(paddedExpected, offset.dy, offset.dx, background);

  // Parse and canonicalize translated input -> repr
  const parseResult = parseGrid({ cells: translatedInput });
  if (!parseResult.ok || !parseResult.repr) {
    return {
      ok: false,
      error: 'Failed to parse translated input',
      details: { parse_error: parseResult.error }
    };
  }

  let translatedRepr = canonicalizeGrid(parseResult.repr);
  translatedRepr.repr_id = hashCanonical(translatedRepr);

  // Execute program on translated input
  const execResult = execute(program, translatedRepr, { grid: translatedInput });

  if (!execResult.ok || !execResult.outputs?.grid) {
    return {
      ok: false,
      error: 'Execution failed on translated input',
      details: { exec_error: execResult.error }
    };
  }

  const translatedOutput = execResult.outputs.grid;

  // Compare translated output to translated expected
  if (translatedOutput.length !== translatedExpected.length) {
    return {
      ok: false,
      error: 'Output dimensions mismatch',
      details: {
        output_height: translatedOutput.length,
        expected_height: translatedExpected.length
      }
    };
  }

  for (let y = 0; y < translatedOutput.length; y++) {
    if (translatedOutput[y].length !== translatedExpected[y].length) {
      return {
        ok: false,
        error: `Row ${y} width mismatch`,
        details: {
          output_width: translatedOutput[y].length,
          expected_width: translatedExpected[y].length
        }
      };
    }

    for (let x = 0; x < translatedOutput[y].length; x++) {
      if (translatedOutput[y][x] !== translatedExpected[y][x]) {
        return {
          ok: false,
          error: `Cell (${y},${x}) mismatch`,
          details: {
            output_value: translatedOutput[y][x],
            expected_value: translatedExpected[y][x],
            position: { y, x },
            offset
          }
        };
      }
    }
  }

  return {
    ok: true,
    details: {
      offset,
      padding
    }
  };
}

