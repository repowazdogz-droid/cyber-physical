export type RoomKey =
  | 'claim'
  | 'assumptions'
  | 'evidence'
  | 'missing'
  | 'framings'
  | 'whatWouldChangeAnalysis'
  | 'constraints'
  | 'tradeoffs'
  | 'causal';

export type SourceType = 'text' | 'image' | 'link';

export interface Source {
  type: SourceType;
  content: string;
}

export type WorkspaceItem = {
  id: string;
  text: string;
  createdAt?: number;
};

export type WorkspaceRooms = Record<RoomKey, WorkspaceItem[]>;

export interface Workspace extends WorkspaceRooms {
  id: string;
  summary: string;
  source: Source;
  createdAt?: number;
}


