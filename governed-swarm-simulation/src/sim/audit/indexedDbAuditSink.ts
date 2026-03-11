/**
 * IndexedDB-backed audit sink. Stores runs and proof records with runId/agentId indexes.
 * Writes are async and do not block the UI thread.
 */

import type { AuditSink, ProofRecord, RunMetadata } from './auditSink'

const DB_NAME = 'GovernedSwarmAudit'
const DB_VERSION = 1
const RUNS_STORE = 'runs'
const PROOF_RECORDS_STORE = 'proofRecords'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(RUNS_STORE)) {
        db.createObjectStore(RUNS_STORE, { keyPath: 'runId' })
      }
      if (!db.objectStoreNames.contains(PROOF_RECORDS_STORE)) {
        const proofStore = db.createObjectStore(PROOF_RECORDS_STORE, { keyPath: 'id', autoIncrement: true })
        proofStore.createIndex('runId', 'runId', { unique: false })
        proofStore.createIndex('agentId', 'agentId', { unique: false })
      }
    }
  })
}

interface StoredProofRecord extends ProofRecord {
  id?: number
}

export function createIndexedDbAuditSink(): AuditSink {
  let dbPromise: Promise<IDBDatabase> | null = null

  const getDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) dbPromise = openDb()
    return dbPromise
  }

  return {
    initRun(meta: RunMetadata): void {
      getDb().then((db) => {
        const tx = db.transaction(RUNS_STORE, 'readwrite')
        const store = tx.objectStore(RUNS_STORE)
        store.put(meta)
      }).catch(() => { /* ignore */ })
    },

    appendProof(record: ProofRecord): void {
      getDb().then((db) => {
        const tx = db.transaction(PROOF_RECORDS_STORE, 'readwrite')
        const store = tx.objectStore(PROOF_RECORDS_STORE)
        store.add(record as StoredProofRecord)
      }).catch(() => { /* ignore */ })
    },

    appendProofBatch(records: ProofRecord[]): void {
      if (records.length === 0) return
      getDb().then((db) => {
        const tx = db.transaction(PROOF_RECORDS_STORE, 'readwrite')
        const store = tx.objectStore(PROOF_RECORDS_STORE)
        records.forEach((record) => store.add(record as StoredProofRecord))
      }).catch(() => { /* ignore */ })
    },

    getRun(runId: string): Promise<{ meta: RunMetadata; records: ProofRecord[] }> {
      return getDb().then((db) => {
        return new Promise((resolve, reject) => {
          const metaTx = db.transaction(RUNS_STORE, 'readonly')
          const metaStore = metaTx.objectStore(RUNS_STORE)
          const metaReq = metaStore.get(runId)

          metaReq.onsuccess = () => {
            const meta = metaReq.result as RunMetadata | undefined
            if (!meta) {
              reject(new Error(`Run not found: ${runId}`))
              return
            }

            const recordsTx = db.transaction(PROOF_RECORDS_STORE, 'readonly')
            const recordsStore = recordsTx.objectStore(PROOF_RECORDS_STORE)
            const index = recordsStore.index('runId')
            const range = IDBKeyRange.only(runId)
            const recordsReq = index.getAll(range)

            recordsReq.onsuccess = () => {
              const stored = (recordsReq.result as StoredProofRecord[]) || []
              const records: ProofRecord[] = stored.map(({ id: _omit, ...r }) => {
                void _omit
                return r
              })
              resolve({ meta, records })
            }
            recordsReq.onerror = () => reject(recordsReq.error)
          }
          metaReq.onerror = () => reject(metaReq.error)
        })
      })
    },
  }
}
