/**
 * The OMEGA Ontology — four layers present in every analysis.
 * Maps to: Constraint Universe (Possible/Impossible/Inevitable),
 * GDF (five tests), Spine (constraints), Vision rooms.
 */

export type OntologyLayer =
  | 'structure'
  | 'constraints'
  | 'uncertainty'
  | 'assumptions';

export interface StructureItem {
  id: string;
  label: string;
  description: string;
  relationships: string[];
  source: 'observed' | 'derived' | 'declared';
}

export interface ConstraintItem {
  id: string;
  label: string;
  description: string;
  type: 'hard' | 'soft' | 'policy';
  status: 'active' | 'violated' | 'satisfied' | 'unknown';
  source: string;
  falsifiable: boolean;
}

export interface UncertaintyItem {
  id: string;
  label: string;
  description: string;
  magnitude: 'low' | 'medium' | 'high' | 'unknown';
  reducible: boolean;
  method?: string;
}

export interface AssumptionItem {
  id: string;
  label: string;
  description: string;
  status: 'active' | 'tested' | 'violated' | 'retired';
  evidence?: string;
  sensitivity: 'low' | 'medium' | 'high';
  testable: boolean;
  test?: string;
}

export interface OntologyState {
  structure: StructureItem[];
  constraints: ConstraintItem[];
  uncertainty: UncertaintyItem[];
  assumptions: AssumptionItem[];
  classified_at: string;
}
