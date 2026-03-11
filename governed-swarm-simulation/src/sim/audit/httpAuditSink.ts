/**
 * HTTP audit sink adapter. POSTs proof batches to /proofs.
 * Backend not implemented; requests may 404. Failures are non-blocking.
 */

import type { AuditSink, ProofRecord, RunMetadata } from './auditSink'

const PROOFS_ENDPOINT = '/proofs'

export interface HttpAuditSinkOptions {
  baseUrl?: string
}

export function createHttpAuditSink(options: HttpAuditSinkOptions = {}): AuditSink {
  const baseUrl = options.baseUrl ?? ''
  const url = () => `${baseUrl}${PROOFS_ENDPOINT}`

  return {
    initRun(_meta: RunMetadata): void {
      // Optional: POST to /runs when backend exists; param reserved for API
      void _meta
    },

    appendProof(record: ProofRecord): void {
      fetch(url(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(() => { /* non-blocking; backend may not exist */ })
    },

    appendProofBatch(records: ProofRecord[]): void {
      if (records.length === 0) return
      fetch(url(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      }).catch(() => { /* non-blocking */ })
    },

    getRun(_runId: string): Promise<{ meta: RunMetadata; records?: ProofRecord[] }> {
      void _runId
      return Promise.reject(new Error('HTTP sink does not support getRun'))
    },
  }
}
