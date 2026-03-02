'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  useEffect(() => {
    // Redirect to artifact page by default
    router.replace(`/analyses/${analysisId}/artifact`)
  }, [analysisId, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-sm text-gray-600">Redirecting to artifact view...</div>
      </div>
    </div>
  )
}
