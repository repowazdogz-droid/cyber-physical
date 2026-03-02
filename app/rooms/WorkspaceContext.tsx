'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Workspace, RoomKey, WorkspaceItem } from './types';

interface WorkspaceContextValue {
  workspace: Workspace | null;
  addItem: (room: RoomKey, text: string) => void;
  removeItem: (room: RoomKey, itemId: string) => void;
  updateSource: (content: string) => void;
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

function loadWorkspace(workspaceId: string): Workspace | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(getStorageKey(workspaceId));
    if (stored) {
      return JSON.parse(stored);
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
      source: {
        type: 'text',
        content: 'A new policy requires all employees to work from the office three days per week.',
      },
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
      causal: [],
      constraints: [],
      tradeoffs: [],
    };
  }

  // Pre-fill new workspaces with starter assumptions
  return {
    id: workspaceId,
    source: {
      type: 'text',
      content: '',
    },
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
    causal: [],
    constraints: [],
    tradeoffs: [],
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
      setWorkspace(loaded);
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

    setWorkspace({
      ...workspace,
      [room]: [...workspace[room], newItem],
    });
  }, [workspace]);

  const removeItem = useCallback((room: RoomKey, itemId: string) => {
    if (!workspace) return;

    setWorkspace({
      ...workspace,
      [room]: workspace[room].filter((item) => item.id !== itemId),
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
        updateSource,
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

