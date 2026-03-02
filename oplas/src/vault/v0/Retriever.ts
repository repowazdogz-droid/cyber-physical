/**
 * Retriever
 * 
 * Retrieves concepts from vault using deterministic index lookup.
 * 
 * Version: 1.0.0
 */

import { ConceptCard, ConceptStatus } from '../../contracts/types/ConceptCard';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { ConceptRetrievalResult, RetrievalMode } from './types';
import { reprKeys } from './SignatureKeys';
import { readIndex } from './Index';
import { readConcept } from './Storage';
import { loadEvidenceIndex, computeKeyFingerprint } from './EvidenceIndex';
import { computePenalty, shouldExclude } from './PenaltyScoring';
import { signatureKeys } from './SignatureKeys';
import { readEmbeddingIndex, computeSimilarities } from './EmbeddingIndex';
import { getOrComputeEmbedding } from './EmbeddingCache';

/**
 * Retrieves concepts from vault with penalty-based de-ranking and optional hybrid similarity.
 * 
 * Algorithm:
 * 1) compute reprKeys
 * 2) compute key fingerprint (top N=3)
 * 3) intersect index buckets for top N keys (start N=3)
 * 4) union candidate concept IDs
 * 5) load evidence index
 * 6) (if HYBRID mode) compute repr embedding and similarity scores
 * 7) deterministic rank:
 *    - primary: key_overlap_count desc
 *    - secondary: penalty P asc
 *    - tertiary: similarity desc (if HYBRID mode)
 *    - quaternary: concept_version desc
 *    - quinary: lexicographic (id,version)
 * 8) apply hard exclusions (if GENERALIZATION_FAIL_PALETTE >= 3)
 * 
 * Return top K.
 */
export async function retrieveConcepts(
  repr: CanonicalRepresentation,
  request: Request,
  vaultRoot: string,
  K: number = 50,
  mode: RetrievalMode = RetrievalMode.SYMBOLIC_ONLY
): Promise<ConceptRetrievalResult & { exclusions?: string[]; penalties?: Record<string, number> }> {
  // Compute repr keys
  const keys = reprKeys(repr, request);

  // Compute key fingerprint
  const keyFingerprint = computeKeyFingerprint(keys);

  // Read index
  const index = await readIndex(vaultRoot);

  // Load evidence index
  const evidenceIndex = await loadEvidenceIndex(vaultRoot);

  // Intersect index buckets for top N keys (N=3)
  const topKeys = keys.slice(0, 3);
  const candidateIds = new Set<string>();

  for (const key of topKeys) {
    const conceptIds = index.by_key[key] || [];
    for (const conceptId of conceptIds) {
      candidateIds.add(conceptId);
    }
  }

  // Load concepts
  const concepts: ConceptCard[] = [];
  const exclusions: string[] = [];
  const penalties: Record<string, number> = {};
  let similarities: Record<string, number> = {};

  // Compute similarity scores if hybrid mode
  if (mode === RetrievalMode.HYBRID) {
    try {
      const embeddingIndex = await readEmbeddingIndex(vaultRoot);
      if (embeddingIndex) {
        const reprEmbedding = await getOrComputeEmbedding(repr, vaultRoot);
        const similarityScores = computeSimilarities(
          reprEmbedding,
          embeddingIndex,
          Array.from(candidateIds)
        );
        for (const score of similarityScores) {
          similarities[score.concept_id] = score.similarity;
        }
      } else {
        // Fallback to SYMBOLIC_ONLY if index not available
        mode = RetrievalMode.SYMBOLIC_ONLY;
      }
    } catch (error) {
      // Fallback to SYMBOLIC_ONLY on error
      mode = RetrievalMode.SYMBOLIC_ONLY;
    }
  }

  // Separate ACTIVE and DEPRECATED concepts
  const activeConcepts: ConceptCard[] = [];
  const deprecatedConcepts: ConceptCard[] = [];

  for (const conceptId of candidateIds) {
    const [id, version] = conceptId.split('@');
    const concept = await readConcept(vaultRoot, id, version);
    if (concept) {
      const conceptKey = `${id}@${version}`;
      const status = concept.status || ConceptStatus.ACTIVE;

      // Skip SUPPRESSED concepts
      if (status === ConceptStatus.SUPPRESSED) {
        // Check if suppressed for this specific key fingerprint
        if (concept.suppressed_for_keys && concept.suppressed_for_keys.length > 0) {
          if (concept.suppressed_for_keys.includes(keyFingerprint)) {
            exclusions.push(conceptKey);
            continue;
          }
        } else {
          // Suppressed globally
          exclusions.push(conceptKey);
          continue;
        }
      }

      const stats = evidenceIndex.by_concept[conceptKey];

      // Check exclusion
      if (shouldExclude(stats, keyFingerprint)) {
        exclusions.push(conceptKey);
        continue;
      }

      // Compute penalty
      const penalty = computePenalty(stats);
      penalties[conceptKey] = penalty;

      // Add heavy penalty for DEPRECATED
      if (status === ConceptStatus.DEPRECATED) {
        penalties[conceptKey] = penalty + 1000; // Heavy penalty
        deprecatedConcepts.push(concept);
      } else {
        activeConcepts.push(concept);
      }
    }
  }

  // Use ACTIVE concepts first, fallback to DEPRECATED only if no ACTIVE matches
  const concepts = activeConcepts.length > 0 ? activeConcepts : deprecatedConcepts;

  // Rank concepts
  concepts.sort((a, b) => {
    const aKey = `${a.id}@${a.version}`;
    const bKey = `${b.id}@${b.version}`;

    // Compute key overlap count
    const aKeys = new Set(signatureKeys(a));
    const bKeys = new Set(signatureKeys(b));
    const aOverlap = topKeys.filter(k => aKeys.has(k)).length;
    const bOverlap = topKeys.filter(k => bKeys.has(k)).length;

    // Primary: key_overlap_count desc
    if (aOverlap !== bOverlap) {
      return bOverlap - aOverlap; // Descending
    }

    // Secondary: penalty P asc (lower penalty = better)
    const aPenalty = penalties[aKey] || 0;
    const bPenalty = penalties[bKey] || 0;
    if (aPenalty !== bPenalty) {
      return aPenalty - bPenalty; // Ascending
    }

    // Tertiary: similarity desc (if hybrid mode)
    if (mode === RetrievalMode.HYBRID) {
      const aSimilarity = similarities[aKey] || 0;
      const bSimilarity = similarities[bKey] || 0;
      if (Math.abs(aSimilarity - bSimilarity) > 1e-6) {
        return bSimilarity - aSimilarity; // Descending
      }
    }

    // Quaternary: concept_version desc (prefer newer unless penalized)
    const aVersion = parseInt(a.version) || 0;
    const bVersion = parseInt(b.version) || 0;
    if (aVersion !== bVersion) {
      return bVersion - aVersion; // Descending
    }

    // Quinary: lexicographic (id, version)
    const idCmp = a.id.localeCompare(b.id);
    if (idCmp !== 0) {
      return idCmp;
    }
    return a.version.localeCompare(b.version);
  });

  // Return top K
  const topConcepts = concepts.slice(0, K);

  return {
    concepts: topConcepts,
    keys_used: topKeys,
    concept_ids: topConcepts.map(c => `${c.id}@${c.version}`),
    similarities: mode === RetrievalMode.HYBRID && Object.keys(similarities).length > 0 ? similarities : undefined,
    retrieval_mode: mode,
    exclusions: exclusions.length > 0 ? exclusions : undefined,
    penalties: Object.keys(penalties).length > 0 ? penalties : undefined
  };
}

