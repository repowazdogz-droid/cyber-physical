/**
 * Embedder
 * 
 * Deterministic embedding generation for representations and concepts.
 * 
 * Version: 1.0.0
 */

import { CanonicalRepresentation, Node } from '../../contracts/types/Repr';
import { ConceptCard } from '../../contracts/types/ConceptCard';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { Domain } from '../../contracts/enums/Domains';

/**
 * Embedder version and metadata.
 */
export interface EmbedderMetadata {
  /** Embedder version */
  version: string;
  /** Weights hash (for determinism) */
  weights_hash: string;
  /** Embedding dimension */
  dimension: number;
}

/**
 * Embedding vector (quantized to int8 for determinism).
 */
export type Embedding = number[]; // Quantized float32/int8

/**
 * Current embedder version.
 */
export const EMBEDDER_VERSION = '1.0.0';

/**
 * Embedding dimension.
 */
export const EMBEDDING_DIMENSION = 64; // Small dimension for v0

/**
 * Deterministic weights hash (v0: simple hash of version).
 */
export const EMBEDDER_WEIGHTS_HASH = hashCanonical(EMBEDDER_VERSION).slice(0, 16);

/**
 * Extracts features from representation for embedding.
 */
function extractReprFeatures(repr: CanonicalRepresentation): {
  domain: string;
  grid_dims: { height: number; width: number };
  component_count: number;
  component_features: Array<{
    bbox: { y_min: number; x_min: number; y_max: number; x_max: number };
    area: number;
    color_hist_summary: number[];
  }>;
  adjacency_stats: { avg_degree: number; max_degree: number };
  symmetry_flags: { has_symmetry: boolean };
} {
  const gridNode = repr.nodes.find(n => n.type === 'grid');
  const gridDims = gridNode?.attrs
    ? {
        height: (gridNode.attrs.height as number) || 0,
        width: (gridNode.attrs.width as number) || 0
      }
    : { height: 0, width: 0 };

  const components = repr.nodes.filter(n => n.type === 'component');
  const componentFeatures = components.map(node => {
    const attrs = node.attrs as any;
    const bbox = attrs.bbox || { y_min: 0, x_min: 0, y_max: 0, x_max: 0 };
    const area = attrs.area || 0;
    const colorHist = attrs.color_histogram || [];
    const colorHistSummary = Array.isArray(colorHist)
      ? colorHist.slice(0, 5).map((e: any) => e?.color || 0)
      : [];

    return {
      bbox,
      area,
      color_hist_summary: colorHistSummary
    };
  });

  // Compute adjacency stats
  const adjacencyCounts = new Map<string, number>();
  for (const edge of repr.edges) {
    if (edge.type === 'adjacent_to') {
      adjacencyCounts.set(edge.src, (adjacencyCounts.get(edge.src) || 0) + 1);
      adjacencyCounts.set(edge.dst, (adjacencyCounts.get(edge.dst) || 0) + 1);
    }
  }
  const degrees = Array.from(adjacencyCounts.values());
  const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;
  const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;

  // Simple symmetry detection (v0: placeholder)
  const hasSymmetry = false; // TODO: Implement symmetry detection

  return {
    domain: repr.domain,
    grid_dims: gridDims,
    component_count: components.length,
    component_features: componentFeatures.sort((a, b) => {
      // Sort by canonical order (bbox position)
      if (a.bbox.y_min !== b.bbox.y_min) return a.bbox.y_min - b.bbox.y_min;
      if (a.bbox.x_min !== b.bbox.x_min) return a.bbox.x_min - b.bbox.x_min;
      return a.area - b.area;
    }),
    adjacency_stats: { avg_degree: avgDegree, max_degree: maxDegree },
    symmetry_flags: { has_symmetry: hasSymmetry }
  };
}

/**
 * Embeds a representation deterministically.
 */
export function embedRepr(repr: CanonicalRepresentation): Embedding {
  const features = extractReprFeatures(repr);
  const embedding: number[] = [];

  // Domain (one-hot encoded, simplified)
  const domainOrdinal = repr.domain === Domain.GRID_2D ? 1 : 0;
  embedding.push(domainOrdinal);

  // Grid dimensions (normalized)
  embedding.push(features.grid_dims.height / 100); // Normalize to [0, 1] range
  embedding.push(features.grid_dims.width / 100);

  // Component count (normalized)
  embedding.push(Math.min(features.component_count / 50, 1));

  // Component features (top 10 components, each contributes 4 values)
  for (let i = 0; i < 10; i++) {
    if (i < features.component_features.length) {
      const comp = features.component_features[i];
      embedding.push(comp.bbox.y_min / 100);
      embedding.push(comp.bbox.x_min / 100);
      embedding.push(Math.min(comp.area / 100, 1));
      embedding.push(comp.color_hist_summary[0] || 0);
    } else {
      embedding.push(0, 0, 0, 0);
    }
  }

  // Adjacency stats
  embedding.push(Math.min(features.adjacency_stats.avg_degree / 10, 1));
  embedding.push(Math.min(features.adjacency_stats.max_degree / 10, 1));

  // Symmetry flags
  embedding.push(features.symmetry_flags.has_symmetry ? 1 : 0);

  // Pad to fixed dimension
  while (embedding.length < EMBEDDING_DIMENSION) {
    embedding.push(0);
  }

  // Truncate if too long
  return embedding.slice(0, EMBEDDING_DIMENSION);
}

/**
 * Embeds a concept card deterministically.
 * Embeds signature keys + template metadata.
 */
export function embedConcept(concept: ConceptCard): Embedding {
  const embedding: number[] = [];

  // Domain (from compatibility)
  const domainOrdinal = 1; // Assume grid_2d for v0
  embedding.push(domainOrdinal);

  // Signature keys (one-hot encoded)
  const signatureKeys = concept.signature.keys || [];
  const keyTypes = ['transform:recolor', 'transform:crop', 'transform:select', 'transform:mask', 'transform:paste'];
  for (const keyType of keyTypes) {
    embedding.push(signatureKeys.includes(keyType) ? 1 : 0);
  }

  // Template metadata (simplified: length, operator counts)
  const templateDsl = concept.template.template_dsl || '';
  embedding.push(Math.min(templateDsl.length / 1000, 1));
  
  const opCounts = {
    recolor: (templateDsl.match(/recolor/g) || []).length,
    crop: (templateDsl.match(/crop/g) || []).length,
    select: (templateDsl.match(/select_components/g) || []).length,
    mask: (templateDsl.match(/mask_from_objects/g) || []).length,
    paste: (templateDsl.match(/paste_at/g) || []).length
  };
  
  for (const op of ['recolor', 'crop', 'select', 'mask', 'paste']) {
    embedding.push(Math.min(opCounts[op as keyof typeof opCounts] / 10, 1));
  }

  // Proof obligations
  const proofObligations = concept.proof_obligations || [];
  embedding.push(proofObligations.includes('shape_preserved') ? 1 : 0);
  embedding.push(proofObligations.includes('palette_invariant') ? 1 : 0);

  // Pad to fixed dimension
  while (embedding.length < EMBEDDING_DIMENSION) {
    embedding.push(0);
  }

  // Truncate if too long
  return embedding.slice(0, EMBEDDING_DIMENSION);
}

/**
 * Computes cosine similarity between two embeddings.
 * Deterministic implementation.
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Quantizes embedding to int8 for storage.
 */
export function quantizeEmbedding(embedding: Embedding): Int8Array {
  const quantized = new Int8Array(embedding.length);
  for (let i = 0; i < embedding.length; i++) {
    // Quantize to [-128, 127] range
    const value = Math.max(-128, Math.min(127, Math.round(embedding[i] * 127)));
    quantized[i] = value;
  }
  return quantized;
}

/**
 * Dequantizes embedding from int8.
 */
export function dequantizeEmbedding(quantized: Int8Array): Embedding {
  const embedding: number[] = [];
  for (let i = 0; i < quantized.length; i++) {
    embedding.push(quantized[i] / 127);
  }
  return embedding;
}

/**
 * Gets embedder metadata.
 */
export function getEmbedderMetadata(): EmbedderMetadata {
  return {
    version: EMBEDDER_VERSION,
    weights_hash: EMBEDDER_WEIGHTS_HASH,
    dimension: EMBEDDING_DIMENSION
  };
}























