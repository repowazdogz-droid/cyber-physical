export type RoomKey = 'assumptions' | 'evidence' | 'causal' | 'constraints' | 'tradeoffs';

export type SourceType = 'text' | 'image' | 'link';

export interface Source {
  type: SourceType;
  content: string;
}

export interface WorkspaceItem {
  id: string;
  text: string;
  createdAt: number;
}

export type Assumption = WorkspaceItem;
export type Evidence = WorkspaceItem;
export type CausalLink = WorkspaceItem;
export type Constraint = WorkspaceItem;
export type TradeoffOption = WorkspaceItem;

export interface Workspace {
  id: string;
  source: Source;
  assumptions: Assumption[];
  evidence: Evidence[];
  causal: CausalLink[];
  constraints: Constraint[];
  tradeoffs: TradeoffOption[];
}





























