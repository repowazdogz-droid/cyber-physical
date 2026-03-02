'use client';

import { useState } from 'react';
import { useWorkspace } from '@/app/state/WorkspaceContext';
import { OmegaAssistModal } from '@/app/rooms/OmegaAssistModal';
import { RoomKey } from '@/app/state/types';

export function SourcePanel() {
  const { workspace, updateSource, addItem } = useWorkspace();
  const [showModal, setShowModal] = useState(false);

  const handleAddToRoom = (room: RoomKey, text: string) => {
    addItem(room, text);
  };

  return (
    <>
      <div
        className="site-card"
        style={{
          padding: '1rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '0.5rem',
        }}
      >
        <label
          htmlFor="source-textarea"
          className="site-text-sm"
          style={{ display: 'block', marginBottom: '0.5rem', color: '#525252', fontWeight: 500 }}
        >
          Source
        </label>
        <textarea
          id="source-textarea"
          value={workspace?.source?.content || ''}
          onChange={(e) => updateSource(e.target.value)}
          placeholder="What are you examining?"
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '0.75rem',
            border: '1px solid #d4d4d4',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            marginBottom: '0.75rem',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#171717';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d4d4d4';
          }}
        />
        <button
          onClick={() => setShowModal(true)}
          className="site-btn site-btn-secondary"
          style={{
            width: '100%',
            fontSize: '0.875rem',
            padding: '0.5rem',
          }}
          disabled={!workspace?.source?.content?.trim()}
        >
          Analyze with Omega RC
        </button>
      </div>
      {showModal && workspace && (
        <OmegaAssistModal
          sourceContent={workspace.source.content}
          onAddToRoom={handleAddToRoom}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

