'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/app/state/WorkspaceContext';
import { RoomKey, WorkspaceItem } from '@/app/state/types';

// Mapping from UI section labels to canonical room keys
const SECTION_TO_KEY: Record<string, string> = {
  'What it claims': 'claim',
  'What it assumes': 'assumptions',
  "What's actually shown": 'evidence',
  "What's missing / unclear": 'missing',
  'Other framings': 'framings',
  'What would materially change this analysis': 'whatWouldChangeAnalysis',
} as const;

// Robust clipboard helper with fallback
async function copyTextToClipboard(text: string): Promise<{ ok: boolean; reason?: string }> {
  // Try modern Clipboard API first
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    }
  } catch (e: any) {
    // fall through to legacy method
  }

  // Legacy fallback (works in more places)
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok ? { ok: true } : { ok: false, reason: "execCommand failed" };
  } catch (e: any) {
    return { ok: false, reason: e?.message || "unknown" };
  }
}

export default function ExplainPage() {
  const router = useRouter();
  const { workspace, addItem, removeItem, updateItem, replaceRoomItems, updateSummary } = useWorkspace();
  const [summaryValue, setSummaryValue] = useState(workspace?.summary || '');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [scaffoldError, setScaffoldError] = useState(false);
  const [copyStatus, setCopyStatus] = useState<null | { kind: "ok" | "err"; msg: string }>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<null | { kind: "ok" | "err"; msg: string }>(null);

  useEffect(() => {
    if (workspace) {
      setIsLoading(false);
      setSummaryValue(workspace.summary || '');
      
      // Generate title from source (first 60 chars)
      const sourceText = workspace.source.content || '';
      const titleText = sourceText.length > 60 
        ? sourceText.substring(0, 60).trim() + '...'
        : sourceText.trim() || 'Untitled Explanation';
      setTitle(titleText);

      // Check if scaffold failed (has source but no content)
      const hasSource = workspace.source.content.trim().length > 0;
      const hasContent = workspace.assumptions.length > 0 || 
                         workspace.evidence.length > 0 || 
                         workspace.constraints.length > 0 || 
                         workspace.tradeoffs.length > 0 ||
                         workspace.summary.trim().length > 0;
      
      if (hasSource && !hasContent) {
        setScaffoldError(true);
      }
    } else {
      // Retry loading after delay
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [workspace]);

  const handleSummaryChange = (value: string) => {
    setSummaryValue(value);
    updateSummary(value);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Could show a toast here, but keeping it minimal
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const generateExportText = () => {
    if (!workspace) return '';
    
    const sourceText = workspace.source.content || '';
    const summary = workspace.summary || '';
    const assumptions = workspace.assumptions.map((item: WorkspaceItem) => `• ${item.text}`).join('\n');
    const evidence = workspace.evidence.map((item: WorkspaceItem) => `• ${item.text}`).join('\n');
    const constraints = workspace.constraints.map((item: WorkspaceItem) => `• ${item.text}`).join('\n');
    const tradeoffs = workspace.tradeoffs.map((item: WorkspaceItem) => `• ${item.text}`).join('\n');
    const whatWouldChange = (workspace.whatWouldChangeAnalysis ?? []).map((item: WorkspaceItem) => `• ${item.text}`).join('\n');
    
    let text = `# Omega RC Analysis\n\n`;
    text += `## Source\n${sourceText}\n\n`;
    text += `## What it claims\n${summary}\n\n`;
    if (assumptions.trim()) text += `## What it assumes\n${assumptions}\n\n`;
    if (evidence.trim()) text += `## What's actually shown\n${evidence}\n\n`;
    if (constraints.trim()) text += `## What's missing / unclear\n${constraints}\n\n`;
    if (tradeoffs.trim()) text += `## Other framings\n${tradeoffs}\n`;
    if (whatWouldChange.trim()) text += `## What would materially change this analysis\n${whatWouldChange}\n`;
    
    return text;
  };

  const handleCopyToClipboard = async () => {
    const text = generateExportText();
    setCopyStatus(null);
    const res = await copyTextToClipboard(text);
    if (res.ok) {
      setCopyStatus({ kind: "ok", msg: "Copied." });
    } else {
      setCopyStatus({ kind: "err", msg: "Copy failed. (Your browser blocked clipboard access.)" });
    }
  };

  const handleDownloadText = () => {
    const text = generateExportText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omega-rc-${workspace?.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!workspace) return;
    setShareStatus(null);
    setShareUrl(null);

    try {
      const r = await fetch("/api/share/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspace }),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.url) {
        setShareStatus({ kind: "err", msg: data?.error || "Share failed." });
        return;
      }

      setShareUrl(data.url);

      const copied = await copyTextToClipboard(data.url);
      if (copied.ok) {
        setShareStatus({ kind: "ok", msg: "Share link created and copied." });
      } else {
        setShareStatus({ kind: "ok", msg: "Share link created. (Copy blocked — use the link shown.)" });
      }
    } catch (e: any) {
      setShareStatus({ kind: "err", msg: e?.message || "Share failed." });
    }
  };

  const handleDownloadPDF = async () => {
    if (!workspace) return;
    try {
      const response = await fetch('/api/pdf/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspace),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('PDF generation failed:', error);
        return;
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omega-rc-${workspace.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  function WhatWouldChangeSection({
    items,
    onAdd,
    onRemove,
    onUpdate,
  }: {
    items: WorkspaceItem[];
    onAdd: (text: string) => void;
    onRemove: (itemId: string) => void;
    onUpdate: (itemId: string, text: string) => void;
  }) {
    const { workspace, replaceRoomItems } = useWorkspace();
    const [isAdding, setIsAdding] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isAddingVariants, setIsAddingVariants] = useState(false);
    const [newItemValue, setNewItemValue] = useState('');

    const handleAdd = () => {
      if (newItemValue.trim()) {
        onAdd(newItemValue.trim());
        setNewItemValue('');
        setIsAdding(false);
      }
    };

    return (
      <section
        style={{
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid #e5e5e5',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#171717',
              margin: 0,
            }}
          >
            What would materially change this analysis
          </h2>
          {workspace?.source?.content && (
            <>
              <button
                onClick={async () => {
                  if (!workspace?.source?.content) return;
                  setIsRefining(true);
                  try {
                    const response = await fetch('/api/explain/scaffold', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sourceContent: workspace.source.content,
                        only: 'whatWouldChangeAnalysis',
                        mode: 'refine',
                        existing: items,
                      }),
                    });
                    const data = await response.json();
                    if (data.ok && data.items && Array.isArray(data.items)) {
                      // Refine REPLACES items - convert to WorkspaceItem[] and replace entire room
                      const refinedItems: WorkspaceItem[] = data.items.map((item: WorkspaceItem | string, idx: number) => {
                        if (typeof item === 'string') {
                          return {
                            id: `refined-${Date.now()}-${idx}`,
                            text: item.trim(),
                            createdAt: Date.now(),
                          };
                        }
                        return {
                          id: item.id || `refined-${Date.now()}-${idx}`,
                          text: item.text.trim(),
                          createdAt: item.createdAt || Date.now(),
                        };
                      });
                      // Replace entire room with refined items
                      replaceRoomItems('whatWouldChangeAnalysis', refinedItems);
                    }
                  } catch (error) {
                    console.error('Refine failed:', error);
                  } finally {
                    setIsRefining(false);
                  }
                }}
                disabled={isRefining || isAddingVariants}
                style={{
                  background: 'none',
                  border: '1px solid #d4d4d4',
                  borderRadius: '0.375rem',
                  color: '#525252',
                  cursor: (isRefining || isAddingVariants) ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  marginRight: '0.5rem',
                  opacity: (isRefining || isAddingVariants) ? 0.5 : 1,
                }}
                title="Refine wording without changing scope."
              >
                {isRefining ? 'Refining...' : 'Refine'}
              </button>
              <button
                onClick={async () => {
                  if (!workspace?.source?.content) return;
                  setIsAddingVariants(true);
                  try {
                    const response = await fetch('/api/explain/scaffold', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sourceContent: workspace.source.content,
                        only: 'whatWouldChangeAnalysis',
                        mode: 'variants',
                        existing: items,
                        n: 2,
                      }),
                    });
                    const data = await response.json();
                    if (data.ok && data.items && Array.isArray(data.items)) {
                      // Variants APPEND - add new items to existing ones
                      data.items.forEach((item: WorkspaceItem | string) => {
                        const text = typeof item === 'string' ? item : item.text;
                        if (text && text.trim()) {
                          onAdd(text.trim());
                        }
                      });
                    }
                  } catch (error) {
                    console.error('Add variants failed:', error);
                  } finally {
                    setIsAddingVariants(false);
                  }
                }}
                disabled={isRefining || isAddingVariants}
                style={{
                  background: 'none',
                  border: '1px solid #d4d4d4',
                  borderRadius: '0.375rem',
                  color: '#525252',
                  cursor: (isRefining || isAddingVariants) ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  opacity: (isRefining || isAddingVariants) ? 0.5 : 1,
                }}
                title="Add alternative formulations without removing existing items."
              >
                {isAddingVariants ? 'Adding...' : 'Add variants'}
              </button>
            </>
          )}
        </div>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#737373',
            marginBottom: '1rem',
            fontStyle: 'italic',
          }}
        >
          This section lists types of information that would affect interpretation. It does not recommend actions or next steps.
        </p>
        {items.length > 0 ? (
          <div style={{ marginBottom: '1rem' }}>
            {items.map((item: WorkspaceItem) => (
              <EditableItem 
                key={item.id} 
                item={item} 
                room="whatWouldChangeAnalysis"
                onUpdate={(itemId, text) => onUpdate(itemId, text)}
                onRemove={(itemId) => onRemove(itemId)}
              />
            ))}
          </div>
        ) : (
          <p
            style={{
              fontSize: '0.875rem',
              color: '#a3a3a3',
              fontStyle: 'italic',
              marginBottom: '1rem',
            }}
          >
            No items yet. This section captures structure, not conclusions.
          </p>
        )}
        {isAdding ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <input
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewItemValue('');
                }
              }}
              autoFocus
              placeholder="Add information type..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d4d4d4',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background: 'none',
                border: 'none',
                color: '#171717',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '0.5rem',
              }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewItemValue('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#737373',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '0.5rem',
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#737373',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ➕ Add
          </button>
        )}
      </section>
    );
  }

  const EditableItem = ({ 
    item, 
    room, 
    onUpdate: propOnUpdate, 
    onRemove: propOnRemove 
  }: { 
    item: WorkspaceItem; 
    room: RoomKey;
    onUpdate?: (itemId: string, text: string) => void;
    onRemove?: (itemId: string) => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.text);

    useEffect(() => {
      setEditValue(item.text);
    }, [item.text]);

    const handleSave = () => {
      if (editValue.trim()) {
        if (propOnUpdate) {
          propOnUpdate(item.id, editValue);
        } else {
          updateItem(room, item.id, editValue);
        }
      }
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditValue(item.text);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            autoFocus
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #60a5fa',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSave}
            style={{
              background: 'none',
              border: 'none',
              color: '#171717',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.5rem',
            }}
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#737373',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.5rem',
            }}
          >
            ×
          </button>
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          padding: '0.75rem',
          marginBottom: '0.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '0.5rem',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fafafa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }}
      >
        <span
          onClick={() => setIsEditing(true)}
          style={{
            flex: 1,
            fontSize: '0.875rem',
            color: '#404040',
            lineHeight: '1.6',
            cursor: 'text',
          }}
        >
          {item.text}
        </span>
        <button
          onClick={() => {
            if (propOnRemove) {
              propOnRemove(item.id);
            } else {
              removeItem(room, item.id);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#737373',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: '0.25rem 0.5rem',
          }}
          title="Delete"
        >
          🗑
        </button>
      </div>
    );
  };

  const Section = ({ room, label, instruction, inspectLink }: {
    room: RoomKey;
    label: string;
    instruction?: string;
    inspectLink: string;
  }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newItemValue, setNewItemValue] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [isAddingVariants, setIsAddingVariants] = useState(false);
    const items = workspace?.[room] ?? [];

    const handleAdd = () => {
      if (newItemValue.trim()) {
        addItem(room, newItemValue);
        setNewItemValue('');
        setIsAdding(false);
      }
    };

    const handleRefine = async () => {
      if (!workspace?.source?.content) return;
      setIsRefining(true);
      try {
        const currentItems = workspace[room] ?? [];
        const response = await fetch('/api/explain/scaffold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceContent: workspace.source.content,
            only: room === 'constraints' ? 'constraints' : room === 'tradeoffs' ? 'tradeoffs' : room,
            mode: 'refine',
            existing: currentItems,
          }),
        });
        const data = await response.json();
        if (data.ok && data.items && Array.isArray(data.items)) {
          // Refine REPLACES items - convert to WorkspaceItem[] and replace entire room
          const refinedItems: WorkspaceItem[] = data.items.map((item: WorkspaceItem | string, idx: number) => {
            if (typeof item === 'string') {
              return {
                id: `refined-${Date.now()}-${idx}`,
                text: item.trim(),
                createdAt: Date.now(),
              };
            }
            return {
              id: item.id || `refined-${Date.now()}-${idx}`,
              text: item.text.trim(),
              createdAt: item.createdAt || Date.now(),
            };
          });
          // Replace entire room with refined items
          replaceRoomItems(room, refinedItems);
        }
      } catch (error) {
        console.error('Refine failed:', error);
      } finally {
        setIsRefining(false);
      }
    };

    const handleAddVariants = async () => {
      if (!workspace?.source?.content) return;
      setIsAddingVariants(true);
      try {
        const currentItems = workspace[room] ?? [];
        const response = await fetch('/api/explain/scaffold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceContent: workspace.source.content,
            only: room === 'constraints' ? 'constraints' : room === 'tradeoffs' ? 'tradeoffs' : room,
            mode: 'variants',
            existing: currentItems,
            n: 2, // Default to 2 variants
          }),
        });
        const data = await response.json();
        if (data.ok && data.items && Array.isArray(data.items)) {
          // Variants APPEND - add new items to existing ones
          data.items.forEach((item: WorkspaceItem | string) => {
            const text = typeof item === 'string' ? item : item.text;
            if (text && text.trim()) {
              addItem(room, text.trim());
            }
          });
        }
      } catch (error) {
        console.error('Add variants failed:', error);
      } finally {
        setIsAddingVariants(false);
      }
    };

    return (
      <section
        style={{
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid #e5e5e5',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: instruction ? '0.5rem' : '1rem' }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#171717',
              margin: 0,
            }}
          >
            {label}
          </h2>
          {workspace?.source?.content && (
            <>
              <button
                onClick={handleRefine}
                disabled={isRefining || isAddingVariants}
                style={{
                  background: 'none',
                  border: '1px solid #d4d4d4',
                  borderRadius: '0.375rem',
                  color: '#525252',
                  cursor: (isRefining || isAddingVariants) ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  marginRight: '0.5rem',
                  opacity: (isRefining || isAddingVariants) ? 0.5 : 1,
                }}
                title="Refine wording without changing scope."
              >
                {isRefining ? 'Refining...' : 'Refine'}
              </button>
              <button
                onClick={handleAddVariants}
                disabled={isRefining || isAddingVariants}
                style={{
                  background: 'none',
                  border: '1px solid #d4d4d4',
                  borderRadius: '0.375rem',
                  color: '#525252',
                  cursor: (isRefining || isAddingVariants) ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  opacity: (isRefining || isAddingVariants) ? 0.5 : 1,
                }}
                title="Add alternative formulations without removing existing items."
              >
                {isAddingVariants ? 'Adding...' : 'Add variants'}
              </button>
            </>
          )}
        </div>
        {workspace?.source?.content && (
          <p style={{ fontSize: '0.75rem', color: '#737373', margin: 0, marginBottom: '0.5rem' }}>
            Refine wording without changing scope. Add alternative formulations without removing existing items.
          </p>
        )}
        {instruction && (
          <p
            style={{
              fontSize: '0.875rem',
              color: '#737373',
              marginBottom: '1rem',
              fontStyle: 'italic',
            }}
          >
            {instruction}
          </p>
        )}
        {items.length > 0 ? (
          <div style={{ marginBottom: '1rem' }}>
            {items.map((item: WorkspaceItem) => (
              <EditableItem key={item.id} item={item} room={room} />
            ))}
          </div>
        ) : (
          <p
            style={{
              fontSize: '0.875rem',
              color: '#a3a3a3',
              fontStyle: 'italic',
              marginBottom: '1rem',
            }}
          >
            No items yet. This section captures structure, not conclusions.
          </p>
        )}
        {isAdding ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <input
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewItemValue('');
                }
              }}
              autoFocus
              placeholder="Add new item..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d4d4d4',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background: 'none',
                border: 'none',
                color: '#171717',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '0.5rem',
              }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewItemValue('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#737373',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '0.5rem',
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#737373',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ➕ Add
          </button>
        )}
      </section>
    );
  };

  // Loading state
  if (isLoading || !workspace) {
    return (
      <div className="site-container">
        <div className="site-main">
          <div className="site-content" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '4rem', textAlign: 'center' }}>
            {isLoading ? (
              <p style={{ fontSize: '1rem', color: '#525252' }}>Loading workspace...</p>
            ) : (
              <div>
                <p style={{ fontSize: '1rem', color: '#525252', marginBottom: '1rem' }}>
                  Workspace not found.
                </p>
                <Link href="/explain" className="site-btn site-btn-primary">
                  Return to Explain
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="site-container">
      <div className="site-main">
        <div className="site-content" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h1
                  className="site-h1"
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    color: '#171717',
                  }}
                >
                  Omega RC Analysis
                </h1>
              </div>
            </div>
            {/* Long input banner */}
            {workspace?.source?.content && workspace.source.content.length > 2000 && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fafafa',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#525252',
                }}
              >
                Note: This input is long. Omega RC is optimized for single claims.
              </div>
            )}
            {/* Export actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleShare}
                className="site-btn site-btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                title="Creates a read-only link to this analysis."
              >
                Create share link
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="site-btn site-btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                title="Copies the full analysis as text."
              >
                Copy analysis
              </button>
              <button
                onClick={handleDownloadText}
                className="site-btn site-btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Download text
              </button>
              <button
                onClick={handleDownloadPDF}
                className="site-btn site-btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Download PDF
              </button>
            </div>
            {/* Status messages */}
            {copyStatus && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.8, color: copyStatus.kind === 'err' ? '#dc2626' : '#16a34a' }}>
                {copyStatus.msg}
              </div>
            )}
            {shareUrl && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', wordBreak: 'break-all', opacity: 0.85 }}>
                Share URL: <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{shareUrl}</a>
              </div>
            )}
            {shareStatus && (
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.8, color: shareStatus.kind === 'err' ? '#dc2626' : '#16a34a' }}>
                {shareStatus.msg}
              </div>
            )}
          </div>

          {/* Scaffold Error Message */}
          {scaffoldError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '0.5rem',
                marginBottom: '2rem',
                fontSize: '0.875rem',
                color: '#92400e',
              }}
            >
              Couldn't draft automatically. You can still edit manually.
            </div>
          )}

          {/* What it claims */}
          <section
            style={{
              marginBottom: '2.5rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #e5e5e5',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#171717',
                marginBottom: '0.5rem',
              }}
            >
              What it claims
            </h2>
            <textarea
              value={summaryValue}
              onChange={(e) => handleSummaryChange(e.target.value)}
              placeholder="What the claim is saying..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                border: '1px solid #d4d4d4',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.6',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#171717';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d4d4d4';
              }}
            />
          </section>

          {/* What it assumes */}
          <Section
            room="assumptions"
            label="What it assumes"
            instruction="Hidden premises that must be true for the claim to hold."
            inspectLink={`/rooms/${workspace.id}/assumptions`}
          />

          {/* What's actually shown */}
          <Section
            room="evidence"
            label="What's actually shown"
            instruction="Only what is directly shown or sourced."
            inspectLink={`/rooms/${workspace.id}/evidence`}
          />

          {/* What's missing / unclear */}
          <Section
            room="constraints"
            label="What's missing / unclear"
            instruction="What limits this claim? What context would change your understanding?"
            inspectLink={`/rooms/${workspace.id}/constraints`}
          />

          {/* Other framings */}
          <Section
            room="tradeoffs"
            label="Other framings"
            instruction="Alternative ways to read the same material."
            inspectLink={`/rooms/${workspace.id}/tradeoffs`}
          />

          {/* What would materially change this analysis */}
          <WhatWouldChangeSection
            items={workspace.whatWouldChangeAnalysis ?? []}
            onAdd={(text) => addItem('whatWouldChangeAnalysis', text)}
            onRemove={(itemId) => removeItem('whatWouldChangeAnalysis', itemId)}
            onUpdate={(itemId, text) => updateItem('whatWouldChangeAnalysis', itemId, text)}
          />

          {/* Footer */}
          <div
            style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e5e5',
              textAlign: 'center',
            }}
          >
            <Link href="/explain" className="site-btn site-btn-secondary" style={{ textDecoration: 'none' }}>
              Inspect another claim
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
