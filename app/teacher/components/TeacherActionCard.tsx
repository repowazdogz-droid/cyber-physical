'use client'

interface TeacherActionCardProps {
  title: string
  description?: string
  onAction: () => void
  actionLabel: string
  calmMode?: boolean
}

export default function TeacherActionCard({
  title,
  description,
  onAction,
  actionLabel,
  calmMode = false
}: TeacherActionCardProps) {
  return (
    <div style={{
      padding: calmMode ? '1rem' : '1.25rem',
      background: '#fff',
      border: '2px solid #ddd',
      borderRadius: '12px',
      marginBottom: calmMode ? '1rem' : '1.5rem'
    }}>
      <h3 style={{
        fontSize: calmMode ? '1rem' : '1.1rem',
        fontWeight: 'bold',
        marginBottom: description ? '0.5rem' : '0.75rem'
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: '0.9rem',
          color: '#666',
          marginBottom: '0.75rem',
          lineHeight: '1.5'
        }}>
          {description}
        </p>
      )}
      <button
        onClick={onAction}
        style={{
          width: '100%',
          padding: calmMode ? '0.875rem 1.5rem' : '1rem 2rem',
          background: '#0066cc',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '8px',
          fontSize: calmMode ? '0.9rem' : '1rem',
          fontWeight: 'bold'
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}








































