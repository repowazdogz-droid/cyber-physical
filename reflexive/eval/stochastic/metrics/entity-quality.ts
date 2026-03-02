export interface EntityMetrics {
  extraction_accuracy: number;
  false_merge_rate: number;
  false_split_rate: number;
}

export interface HumanLabel {
  claim_id: string;
  true_entity: string;
  extracted_entity: string;
}

export function computeEntityMetrics(labels: HumanLabel[] | null): EntityMetrics | null {
  if (!labels || labels.length === 0) {
    return null;
  }

  let correct = 0;
  let falseMerges = 0;
  let falseSplits = 0;
  const entityGroups = new Map<string, Set<string>>();

  for (const label of labels) {
    if (label.true_entity === label.extracted_entity) {
      correct++;
    } else {
      // Check for false merge: multiple true entities mapped to same extracted
      const existing = entityGroups.get(label.extracted_entity);
      if (existing && !existing.has(label.true_entity)) {
        falseMerges++;
      }
      // Check for false split: same true entity mapped to different extracted
      // (would need more context to detect this properly)
    }

    if (!entityGroups.has(label.extracted_entity)) {
      entityGroups.set(label.extracted_entity, new Set());
    }
    entityGroups.get(label.extracted_entity)!.add(label.true_entity);
  }

  return {
    extraction_accuracy: labels.length > 0 ? correct / labels.length : 0,
    false_merge_rate: labels.length > 0 ? falseMerges / labels.length : 0,
    false_split_rate: labels.length > 0 ? falseSplits / labels.length : 0,
  };
}
