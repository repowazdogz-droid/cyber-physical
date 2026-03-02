'use client'

interface JsonViewerProps {
  data: any
}

export function JsonViewer({ data }: JsonViewerProps) {
  const jsonString = JSON.stringify(data, null, 2)

  return (
    <pre className="overflow-x-auto text-[11px] font-mono text-gray-800">
      <code>{jsonString}</code>
    </pre>
  )
}
