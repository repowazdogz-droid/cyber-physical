import type { InstitutionalArtifact } from './artifact-domain/artifact.types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || ''

export interface AnalysisListItem {
  analysis_id: string
  created_at: string
  confidence_score: number | null
  convergence_count: number
  divergence_count: number
  orphan_count: number
  status: string
  stimulus_text: string | null
  stimulus_type: 'question' | 'decision' | 'scenario' | 'assessment_request' | null
  lens_count: number
}

export interface CreateAnalysisRequest {
  stimulus: {
    text: string
    type: 'question' | 'decision' | 'scenario' | 'assessment_request'
  }
  context?: {
    documents?: Array<{
      doc_id: string
      title?: string
      source: 'user_upload' | 'url' | 'internal'
      url?: string
      excerpt?: string
      created_at?: string
    }>
  }
  options?: {
    dry_run?: boolean
    lenses?: string[]
    max_claims_per_lens?: number
    save?: boolean
  }
}

export interface DemoPackResponse {
  analysis_id: string
  created_at: string
  schema_version: string
  model_snapshot: {
    llm_model: string | null
    embedding_model: string | null
    run_id: string | null
    created_at: string
  }
  request?: {
    stimulus?: {
      text?: string
      type?: 'question' | 'decision' | 'scenario' | 'assessment_request'
    }
  }
  summary: {
    confidence_score: number | null
    band: string
    convergence_count: number
    divergence_count: number
    orphan_count: number
  }
  exec_summary: string
  redlines: Array<{
    type: 'convergence' | 'divergence' | 'orphan' | 'evidence_gap'
    theme?: string
    claim_ids: string[]
    lenses?: string[]
    why_it_matters: string
    converges?: Array<{ claim_id: string; lens: string; text: string }>
    diverges?: Array<{ side: string; claim_ids: string[]; lenses: string[]; texts: string[] }>
    missing_evidence?: Array<{ claim_id: string; text: string; suggested_evidence: string }>
  }>
  synthesis: any
  artifacts: any
  config_snapshot: any
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: { message: 'Unknown error', code: 'UNKNOWN_ERROR' },
    }))
    const errorMessage = errorBody.error?.message || `HTTP ${response.status}`
    const errorCode = errorBody.error?.code || `HTTP_${response.status}`
    const err = new Error(errorMessage) as Error & { 
      code?: string
      status?: number
      body?: any
    }
    err.code = errorCode
    err.status = response.status
    err.body = errorBody
    throw err
  }

  return response.json()
}

export interface RawAnalysisResponse {
  analysis_id: string
  created_at: string
  inputs?: {
    stimulus?: {
      text?: string
      type?: 'question' | 'decision' | 'scenario' | 'assessment_request'
    }
    context?: any
    options?: any
  }
  request?: {
    stimulus?: {
      text?: string
      type?: 'question' | 'decision' | 'scenario' | 'assessment_request'
    }
    context?: any
  }
  lens_results?: Array<{
    lens: string
    status: 'ok' | 'error'
    error?: { code: string; message: string }
    raw_text?: string
    claim_ids?: string[]
    duration_ms?: number
  }>
  claims?: Array<{
    claim_id: string
    text: string
    [key: string]: any
  }>
  evidence?: {
    items?: Array<{ id: string; [key: string]: any }>
    links?: Array<{ claim_id: string; evidence_item_id: string; [key: string]: any }>
  }
  engine_output?: {
    synthesis?: {
      confidence_score?: number | null
      [key: string]: any
    }
    [key: string]: any
  }
  warnings?: string[]
  [key: string]: any
}

export const api = {
  listAnalyses: () =>
    fetchAPI<AnalysisListItem[]>('/v1/analyses'),

  getAnalysis: (id: string) =>
    fetchAPI<DemoPackResponse>(`/v1/analyses/${id}/demo-pack`),

  getStoredAnalysis: (id: string) =>
    fetchAPI<RawAnalysisResponse>(`/v1/analyses/${id}`),

  getRawAnalysis: (id: string) =>
    fetchAPI<RawAnalysisResponse>(`/v1/analyses/${id}`),

  getArtifact: (id: string) =>
    fetchAPI<InstitutionalArtifact>(`/v1/analyses/${id}/artifact`),

  createAnalysis: (data: CreateAnalysisRequest) =>
    fetchAPI<{ analysis_id: string; created_at: string }>('/v1/analyses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
