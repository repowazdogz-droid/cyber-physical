'use client'

import React, { useState } from 'react'
import { LearningBoard } from './BoardTypes'
import { ThoughtObject, extractText } from './ThoughtObjects'
import { TAP_MIN_PX, SPACING, TEXT_SIZES } from '../ui/uiTokens'

interface LearningBoardProps {
  board: LearningBoard
  calmMode?: boolean
  onToggleUncertainty?: (objectId: string) => void
  onRemoveObject?: (objectId: string) => void
}

/**
 * Learning Board UI Component
 * 
 * ND-first, 2D view, XR-ready structure.
 * Default: 3-5 visible objects max.
 * One column only.
 */
export default function LearningBoardComponent({
  board,
  calmMode = false,
  onToggleUncertainty,
  onRemoveObject
}: LearningBoardProps) {
  const [showAll, setShowAll] = useState(false)
  
  // Get objects in layout order
  const orderedObjects = board.layout.order
    .map(id => board.objects.find(o => o.id === id))
    .filter((obj): obj is ThoughtObject => obj !== undefined)
  
  // Limit visible objects in calm mode
  const maxVisible = calmMode ? 3 : 5
  const visibleObjects = showAll ? orderedObjects : orderedObjects.slice(0, maxVisible)
  const hasMore = orderedObjects.length > maxVisible
  
  // Get type icon and label
  const getTypeInfo = (type: ThoughtObject['type']) => {
    switch (type) {
      case 'LearnerAttempt':
        return { icon: '✍️', label: 'Your Try' }
      case 'TutorHint':
        return { icon: '💡', label: 'Hint' }
      case 'Example':
        return { icon: '📝', label: 'Example' }
      case 'Question':
        return { icon: '❓', label: 'Question' }
      case 'Evidence':
        return { icon: '🔍', label: 'Evidence' }
      case 'Uncertainty':
        return { icon: '🤔', label: 'Unsure' }
      case 'Reflection':
        return { icon: '💭', label: 'Reflection' }
      default:
        return { icon: '📌', label: type }
    }
  }
  
  if (board.objects.length === 0) {
    return null // Don't show empty board
  }
  
  return (
    <div style={{
      marginTop: SPACING.standard.md,
      padding: SPACING.standard.md,
      background: '#f9f9f9',
      border: '1px solid #e0e0e0',
      borderRadius: '8px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.standard.md
      }}>
        <div>
          <h3 style={{ fontSize: TEXT_SIZES.h3, margin: 0, marginBottom: '0.25rem' }}>
            Thinking Board
          </h3>
          {board.pathId && board.currentStepId && (
            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
              Step {board.currentStepId}
            </p>
          )}
        </div>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              padding: '0.5rem 1rem',
              background: '#fff',
              border: '1px solid #ddd',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}
          >
            {showAll ? 'Show Less' : `Show All (${orderedObjects.length})`}
          </button>
        )}
      </div>
      
      {/* Objects (one column) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.small }}>
        {visibleObjects.map((obj) => {
          const typeInfo = getTypeInfo(obj.type)
          const text = extractText(obj.content)
          const isUncertain = obj.confidence === 'low' || obj.confidence === 'unknown'
          
          return (
            <div
              key={obj.id}
              style={{
                padding: SPACING.standard.md,
                background: isUncertain ? '#fff3cd' : '#fff',
                border: `2px solid ${isUncertain ? '#ffc107' : '#e0e0e0'}`,
                borderRadius: '8px',
                minHeight: `${TAP_MIN_PX}px`
              }}
            >
              {/* Type label */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.small
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{typeInfo.icon}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#666',
                    textTransform: 'uppercase'
                  }}>
                    {typeInfo.label}
                  </span>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {onToggleUncertainty && (
                    <button
                      onClick={() => onToggleUncertainty(obj.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: isUncertain ? '#ffc107' : '#f5f5f5',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}
                      title="I'm unsure"
                    >
                      {isUncertain ? '✓ Unsure' : 'Unsure?'}
                    </button>
                  )}
                  {onRemoveObject && (
                    <button
                      onClick={() => onRemoveObject(obj.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        color: '#999'
                      }}
                      title="Remove"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div style={{
                fontSize: '0.95rem',
                lineHeight: '1.5',
                color: '#333'
              }}>
                {text}
              </div>
              
              {/* Source indicator */}
              <div style={{
                marginTop: SPACING.small,
                fontSize: '0.75rem',
                color: '#999',
                fontStyle: 'italic'
              }}>
                {obj.source === 'learner' ? 'You' : obj.source === 'tutor' ? 'Tutor' : 'System'}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Show more indicator */}
      {!showAll && hasMore && (
        <div style={{
          marginTop: SPACING.small,
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          +{orderedObjects.length - maxVisible} more
        </div>
      )}
    </div>
  )
}




