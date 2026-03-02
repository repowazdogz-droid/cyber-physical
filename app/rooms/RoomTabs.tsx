'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { roomConfig } from './roomConfig';
import { type RoomKey } from '@/app/state/types';

// Helper to load workspace completion state from localStorage
function getRoomCompletion(workspaceId: string, room: RoomKey): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(`workspace_${workspaceId}`);
    if (stored) {
      const workspace = JSON.parse(stored);
      switch (room) {
        case 'assumptions':
          return workspace.assumptions?.length > 0;
        case 'evidence':
          return workspace.evidence?.length > 0;
        case 'causal':
          return workspace.causal?.length > 0;
        case 'constraints':
          return workspace.constraints?.length > 0;
        case 'tradeoffs':
          return workspace.tradeoffs?.length > 0;
        default:
          return false;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export default function RoomTabs() {
  const pathname = usePathname();
  
  const rooms: RoomKey[] = ['assumptions', 'evidence', 'causal', 'constraints', 'tradeoffs'];
  
  const isActive = (room: RoomKey) => {
    if (!pathname) return false;
    // Match pattern: /rooms/[workspaceId]/[room] or /rooms/[workspaceId]/[room]/...
    const match = pathname.match(/\/rooms\/[^/]+\/([^/]+)/);
    return match?.[1] === room;
  };

  // Extract workspaceId from pathname
  const match = pathname?.match(/\/rooms\/([^/]+)/);
  const workspaceId = match?.[1] || 'demo';

  return (
    <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {rooms.map((room) => {
        const config = roomConfig[room];
        const active = isActive(room);
        const hasItemsInRoom = getRoomCompletion(workspaceId, room);
        return (
          <Link
            key={room}
            href={`/rooms/${workspaceId}/${room}`}
            className={active ? 'site-nav-link-active' : 'site-nav-link'}
            style={{
              fontWeight: active ? 600 : 400,
              borderBottom: active ? `2px solid ${config.accentColor}` : 'none',
              paddingBottom: active ? 'calc(0.5rem - 2px)' : '0.5rem',
              position: 'relative',
            }}
          >
            {config.label}
            {hasItemsInRoom && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: config.accentColor,
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

