/**
 * Grid 2D Domain Types
 * 
 * Types specific to grid_2d domain.
 * 
 * Version: 1.0.0
 */

/**
 * RawGridInput: Raw grid input format.
 */
export interface RawGridInput {
  /** Grid cells: number[][] (ints 0..K) */
  cells: number[][];
  /** Optional palette size (default: max value in cells) */
  palette_size?: number;
}

/**
 * ComponentAttributes: Attributes for a connected component.
 */
export interface ComponentAttributes {
  /** Bounding box */
  bbox: {
    y_min: number;
    x_min: number;
    y_max: number;
    x_max: number;
  };
  /** Area (number of cells) */
  area: number;
  /** Centroid (integer pair if possible) */
  centroid?: {
    y: number;
    x: number;
  };
  /** Color histogram (sorted by color) */
  color_histogram: Array<{
    color: number;
    count: number;
  }>;
  /** Perimeter (optional) */
  perimeter?: number;
}

/**
 * GridMetadata: Global grid metadata.
 */
export interface GridMetadata {
  /** Grid height */
  height: number;
  /** Grid width */
  width: number;
  /** Palette size */
  palette_size: number;
  /** Neighborhood type (4 or 8) */
  neighborhood: 4 | 8;
}























