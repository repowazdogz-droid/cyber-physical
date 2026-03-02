'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ExportButton() {
  const pathname = usePathname();
  
  // Extract workspaceId from pathname: /rooms/[workspaceId]/...
  const match = pathname?.match(/\/rooms\/([^/]+)/);
  const workspaceId = match?.[1];
  
  if (!workspaceId || pathname?.includes('/export')) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
      <Link
        href={`/rooms/${workspaceId}/export`}
        className="site-btn site-btn-secondary"
        style={{
          fontSize: '0.875rem',
          padding: '0.5rem 0.75rem',
          textDecoration: 'none',
        }}
      >
        Export
      </Link>
      <span
        style={{
          fontSize: '0.75rem',
          color: '#737373',
          whiteSpace: 'nowrap',
        }}
      >
        Print or save as PDF
      </span>
    </div>
  );
}

