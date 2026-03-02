'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function DevIdentityBanner() {
  const pathname = usePathname();
  const [origin, setOrigin] = useState<string>('');
  const [surface, setSurface] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (pathname?.startsWith('/explain')) {
      setSurface('Explain');
    } else if (pathname?.startsWith('/rooms')) {
      setSurface('Rooms (Advanced)');
    } else {
      setSurface('');
    }
  }, [pathname]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        backgroundColor: '#171717',
        color: '#ffffff',
        padding: '0.75rem 1rem',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        zIndex: 9999,
        borderRadius: '0.5rem',
        border: '2px solid #60a5fa',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: '200px',
      }}
    >
      <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.875rem' }}>
        OMEGA (DEV)
      </div>
      {surface && (
        <div style={{ color: '#a3a3a3', fontSize: '0.7rem' }}>
          Surface: {surface}
        </div>
      )}
      <div style={{ color: '#a3a3a3', fontSize: '0.7rem' }}>
        Origin: {origin || 'loading...'}
      </div>
      <div style={{ color: '#a3a3a3', fontSize: '0.7rem' }}>
        Route: {pathname || 'loading...'}
      </div>
    </div>
  );
}

