'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Workspace, RoomKey, WorkspaceItem } from './types';

interface WorkspaceContextValue {
  workspace: Workspace | null;
  addItem: (room: RoomKey, text: string) => void;
  removeItem: (room: RoomKey, itemId: string) => void;
  updateItem: (room: RoomKey, itemId: string, text: string) => void;
  replaceRoomItems: (room: RoomKey, items: WorkspaceItem[]) => void;
  updateSource: (content: string) => void;
  updateSummary: (summary: string) => void;
  hasAssumptions: boolean;
  hasEvidence: boolean;
  hasCausal: boolean;
  hasConstraints: boolean;
  hasTradeoffs: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_PREFIX = 'workspace_';

function getStorageKey(workspaceId: string): string {
  return `${STORAGE_PREFIX}${workspaceId}`;
}

function splitMultilineText(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-•]\s+/, '').trim())
    .filter((line) => line.length > 0);
}

function normalizeMultilineItems(items: WorkspaceItem[]): WorkspaceItem[] {
  const out: WorkspaceItem[] = [];
  for (const item of items || []) {
    const text = item?.text || '';
    const lines = splitMultilineText(text);
    if (lines.length <= 1) {
      // Single line or empty, keep as-is
      if (text.trim()) {
        out.push(item);
      }
    } else {
      // Split multiline item into multiple items
      for (const line of lines) {
        out.push({
          ...item,
          id: crypto.randomUUID(),
          text: line,
          createdAt: item.createdAt ?? Date.now(),
        });
      }
    }
  }
  return out;
}

function loadWorkspace(workspaceId: string): Workspace | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(getStorageKey(workspaceId));
    if (stored) {
      const parsed = JSON.parse(stored);
      // Normalize multiline items in all rooms
      const normalized: Workspace = {
        ...parsed,
        claim: normalizeMultilineItems(parsed.claim || []),
        assumptions: normalizeMultilineItems(parsed.assumptions || []),
        evidence: normalizeMultilineItems(parsed.evidence || []),
        missing: normalizeMultilineItems(parsed.missing || parsed.constraints || []),
        framings: normalizeMultilineItems(parsed.framings || parsed.tradeoffs || []),
        constraints: normalizeMultilineItems(parsed.constraints || []),
        tradeoffs: normalizeMultilineItems(parsed.tradeoffs || []),
        causal: normalizeMultilineItems(parsed.causal || []),
        whatWouldChangeAnalysis: normalizeMultilineItems(parsed.whatWouldChangeAnalysis || []),
      };
      return normalized;
    }
  } catch (error) {
    console.error('Failed to load workspace:', error);
  }
  return null;
}

function saveWorkspace(workspaceId: string, workspace: Workspace): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(workspace));
  } catch (error) {
    console.error('Failed to save workspace:', error);
  }
}

function createEmptyWorkspace(workspaceId: string): Workspace {
  // Pre-fill demo workspace with example content
  if (workspaceId === 'demo') {
    return {
      id: workspaceId,
      summary: '',
      source: {
        type: 'text',
        content: 'A new policy requires all employees to work from the office three days per week.',
      },
      claim: [],
      assumptions: [
        {
          id: 'demo-1',
          text: 'The policy applies uniformly to all employees.',
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'demo-2',
          text: 'Remote work is possible for the remaining days.',
          createdAt: Date.now() - 1800000,
        },
      ],
      evidence: [],
      missing: [],
      framings: [],
      causal: [],
      constraints: [],
      tradeoffs: [],
      whatWouldChangeAnalysis: [],
    };
  }

  // Pre-fill new workspaces with starter assumptions
  return {
    id: workspaceId,
    summary: '',
    source: {
      type: 'text',
      content: '',
    },
    claim: [],
    assumptions: [
      {
        id: 'starter-1',
        text: 'This assumes the source is representative.',
        createdAt: Date.now(),
      },
      {
        id: 'starter-2',
        text: 'This assumes no important context is missing.',
        createdAt: Date.now(),
      },
      {
        id: 'starter-3',
        text: 'This assumes correlation implies causation.',
        createdAt: Date.now(),
      },
    ],
    evidence: [],
    missing: [],
    framings: [],
    causal: [],
    constraints: [],
    tradeoffs: [],
    whatWouldChangeAnalysis: [],
  };
}

export function WorkspaceProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    const loaded = loadWorkspace(workspaceId);
    if (loaded) {
      // loadWorkspace already normalizes multiline items, just ensure all fields exist
      const normalizedWorkspace: Workspace = {
        ...loaded,
        summary: loaded.summary || '',
        claim: loaded.claim ?? [],
        assumptions: loaded.assumptions ?? [],
        evidence: loaded.evidence ?? [],
        missing: loaded.missing ?? (loaded.constraints ?? []), // Map constraints to missing if missing not present
        framings: loaded.framings ?? (loaded.tradeoffs ?? []), // Map tradeoffs to framings if framings not present
        constraints: loaded.constraints ?? [],
        tradeoffs: loaded.tradeoffs ?? [],
        causal: loaded.causal ?? [],
        whatWouldChangeAnalysis: loaded.whatWouldChangeAnalysis ?? [],
        createdAt: loaded.createdAt ?? Date.now(),
      };
      setWorkspace(normalizedWorkspace);
    } else {
      // Only create pre-filled demo if workspace doesn't exist
      const newWorkspace = createEmptyWorkspace(workspaceId);
      setWorkspace(newWorkspace);
      saveWorkspace(workspaceId, newWorkspace);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspace) {
      saveWorkspace(workspaceId, workspace);
    }
  }, [workspace, workspaceId]);

  const addItem = useCallback((room: RoomKey, text: string) => {
    if (!text.trim() || !workspace) return;

    const newItem: WorkspaceItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      createdAt: Date.now(),
    };

    const currentItems = workspace[room] ?? [];
    setWorkspace({
      ...workspace,
      [room]: [...currentItems, newItem],
    });
  }, [workspace]);

  const removeItem = useCallback((room: RoomKey, itemId: string) => {
    if (!workspace) return;

    const currentItems = workspace[room] ?? [];
    setWorkspace({
      ...workspace,
      [room]: currentItems.filter((item: WorkspaceItem) => item.id !== itemId),
    });
  }, [workspace]);

  const updateItem = useCallback((room: RoomKey, itemId: string, text: string) => {
    if (!workspace) return;

    const currentItems = workspace[room] ?? [];
    setWorkspace({
      ...workspace,
      [room]: currentItems.map((item: WorkspaceItem) =>
        item.id === itemId ? { ...item, text: text.trim() } : item
      ),
    });
  }, [workspace]);

  const replaceRoomItems = useCallback((room: RoomKey, items: WorkspaceItem[]) => {
    if (!workspace) return;

    setWorkspace({
      ...workspace,
      [room]: items,
    });
  }, [workspace]);

  const updateSource = useCallback((content: string) => {
    if (!workspace) return;

    setWorkspace({
      ...workspace,
      source: {
        ...workspace.source,
        content,
      },
    });
  }, [workspace]);

  const updateSummary = useCallback((summary: string) => {
    if (!workspace) return;

    setWorkspace({
      ...workspace,
      summary,
    });
  }, [workspace]);

  if (!workspace) {
    return <div>Loading...</div>;
  }

  const hasAssumptions = workspace.assumptions.length > 0;
  const hasEvidence = workspace.evidence.length > 0;
  const hasCausal = workspace.causal.length > 0;
  const hasConstraints = workspace.constraints.length > 0;
  const hasTradeoffs = workspace.tradeoffs.length > 0;

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        addItem,
        removeItem,
        updateItem,
        replaceRoomItems,
        updateSource,
        updateSummary,
        hasAssumptions,
        hasEvidence,
        hasCausal,
        hasConstraints,
        hasTradeoffs,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}

