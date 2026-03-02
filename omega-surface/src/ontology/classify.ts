/**
 * Helpers to classify content into ontology layers.
 */

import type {
  OntologyState,
  StructureItem,
  ConstraintItem,
  UncertaintyItem,
  AssumptionItem,
} from './types.js';

export interface ClassifiableItem {
  id: string;
  label: string;
  description: string;
  layer: 'structure' | 'constraints' | 'uncertainty' | 'assumptions';
  /** Optional layer-specific fields; minimal shape for classification. */
  source?: StructureItem['source'];
  type?: ConstraintItem['type'];
  status?: ConstraintItem['status'] | AssumptionItem['status'];
  magnitude?: UncertaintyItem['magnitude'];
  relationships?: string[];
  falsifiable?: boolean;
  reducible?: boolean;
  sensitivity?: AssumptionItem['sensitivity'];
  testable?: boolean;
}

/**
 * Build OntologyState from a list of classifiable items.
 */
export function classifyToOntologyState(items: ClassifiableItem[]): OntologyState {
  const structure: StructureItem[] = [];
  const constraints: ConstraintItem[] = [];
  const uncertainty: UncertaintyItem[] = [];
  const assumptions: AssumptionItem[] = [];

  for (const item of items) {
    const base = { id: item.id, label: item.label, description: item.description };
    switch (item.layer) {
      case 'structure':
        structure.push({
          ...base,
          relationships: item.relationships ?? [],
          source: item.source ?? 'declared',
        });
        break;
      case 'constraints':
        constraints.push({
          ...base,
          type: item.type ?? 'soft',
          status:
            (item.layer === 'constraints'
              ? (item.status as 'active' | 'violated' | 'satisfied' | 'unknown')
              : undefined) ?? 'active',
          source: '',
          falsifiable: item.falsifiable ?? false,
        });
        break;
      case 'uncertainty':
        uncertainty.push({
          ...base,
          magnitude: item.magnitude ?? 'unknown',
          reducible: item.reducible ?? true,
        });
        break;
      case 'assumptions':
        assumptions.push({
          ...base,
          status: (item.status as AssumptionItem['status']) ?? 'active',
          sensitivity: item.sensitivity ?? 'medium',
          testable: item.testable ?? false,
        });
        break;
    }
  }

  return {
    structure,
    constraints,
    uncertainty,
    assumptions,
    classified_at: new Date().toISOString(),
  };
}
