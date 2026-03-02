'use client';

import { useState, useEffect } from 'react';

const GUIDE_DISMISSED_KEY = 'rooms-guide-dismissed';

export function GuideOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(GUIDE_DISMISSED_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GUIDE_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={handleDismiss}
    >
      <div
        className="site-card-lg"
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            color: '#171717',
          }}
        >
          How to use the 5 Rooms
        </h2>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 2rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <li
            style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#404040',
              paddingLeft: '1.5rem',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                color: '#171717',
              }}
            >
              •
            </span>
            Each room enforces a different way of thinking.
          </li>
          <li
            style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#404040',
              paddingLeft: '1.5rem',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                color: '#171717',
              }}
            >
              •
            </span>
            Move between rooms — don't try to solve everything in one.
          </li>
          <li
            style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#404040',
              paddingLeft: '1.5rem',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                color: '#171717',
              }}
            >
              •
            </span>
            Nothing decides for you.
          </li>
        </ul>
        <button
          onClick={handleDismiss}
          className="site-btn site-btn-primary"
          style={{
            width: '100%',
          }}
        >
          Begin
        </button>
      </div>
    </div>
  );
}





























