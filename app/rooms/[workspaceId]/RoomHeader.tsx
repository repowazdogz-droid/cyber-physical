'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { roomConfig } from '../roomConfig';
import { RoomKey } from '@/app/state/types';

export function RoomHeader({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  
  // Extract room from pathname: /rooms/[workspaceId]/[room]
  const match = pathname?.match(/\/rooms\/[^/]+\/([^/]+)/);
  const roomKey = match?.[1] as RoomKey | undefined;
  
  if (!roomKey || !roomConfig[roomKey]) {
    return null;
  }
  
  const roomLabel = roomConfig[roomKey].label;
  
  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e5e5e5',
        marginBottom: '1rem',
        fontSize: '0.875rem',
        color: '#525252',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>
        Inspecting: <strong>{roomLabel}</strong>
      </span>
      <Link
        href={`/explain/${workspaceId}`}
        style={{
          color: '#737373',
          textDecoration: 'none',
          fontStyle: 'italic',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#171717';
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#737373';
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        Back to explanation →
      </Link>
    </div>
  );
}





























