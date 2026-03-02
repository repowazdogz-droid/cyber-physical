'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function DevBanner() {
  const pathname = usePathname();
  const [surface, setSurface] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Add padding to body to account for banner
      document.body.style.paddingTop = '32px';
      return () => {
        document.body.style.paddingTop = '';
      };
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
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#171717',
        color: '#ffffff',
        padding: '0.5rem 1rem',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #404040',
        height: '32px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: 600 }}>OMEGA (DEV)</span>
        {surface && (
          <>
            <span style={{ color: '#a3a3a3' }}>•</span>
            <span>Surface: {surface}</span>
          </>
        )}
        <span style={{ color: '#a3a3a3' }}>•</span>
        <span>Host: 127.0.0.1</span>
        <span style={{ color: '#a3a3a3' }}>•</span>
        <span>Port: 3001</span>
      </div>
      <span style={{ color: '#a3a3a3', fontSize: '0.7rem' }}>DEV MODE</span>
    </div>
  );
}

