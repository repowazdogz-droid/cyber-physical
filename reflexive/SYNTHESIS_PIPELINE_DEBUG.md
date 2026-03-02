# Synthesis Pipeline Code Path Analysis

## Code Path: POST /v1/analyses → writeSynthesis

### 1. Route Handler (`src/api/routes/analysis.ts:140`)
```typescript
const result = await runAnalysisForApi(body, analysisId);
```
✅ **SYNCHRONOUS** - Uses `await`, errors bubble up

### 2. runAnalysisForApi (`src/api/orchestrator.ts:94`)
```typescript
await runAnalysis(caseId, analysisId);
```
✅ **SYNCHRONOUS** - Uses `await`, errors bubble up
- Has try/catch that logs and re-throws (line 175-177)

### 3. runAnalysis (`src/analysis/orchestrator.ts:368-373`)
```typescript
const engineOutput = await computeSynthesis(engineInput, embeddings);
console.log('[ANALYSIS] Synthesis computed', { confidence_score: engineOutput.confidence_score }); // ❌ BUG HERE
await writeSynthesis(analysis_id, engineOutput, engineOutput.claim_annotations);
```
✅ **SYNCHRONOUS** - Both `await`ed
- Has try/catch that logs and re-throws (line 376-388)

### 4. writeSynthesis (`src/synthesis/writer.ts:9-86`)
```typescript
export async function writeSynthesis(...) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ... updates claims ...
    // ... inserts synthesis ...
    // ... updates analysis ...
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // ✅ Re-throws error
  } finally {
    client.release();
  }
}
```
✅ **ERROR HANDLING** - Errors are caught, rolled back, and re-thrown

---

## 🐛 BUGS FOUND

### Bug #1: Incorrect property access in log (Line 369)
**File:** `src/analysis/orchestrator.ts:369`
```typescript
console.log('[ANALYSIS] Synthesis computed', { confidence_score: engineOutput.confidence_score });
```

**Problem:** `engineOutput` is of type `EngineOutput` which has structure:
```typescript
{
  synthesis: {
    confidence_score: number;
    ...
  }
}
```

**Should be:**
```typescript
console.log('[ANALYSIS] Synthesis computed', { confidence_score: engineOutput.synthesis.confidence_score });
```

**Impact:** This will log `undefined` for `confidence_score`, but more importantly, if TypeScript is strict or if there's a runtime check, this could cause an error that stops execution before `writeSynthesis` is called.

---

## 🔍 POTENTIAL SILENT FAILURE POINTS

### 1. Database Connection Pool Exhaustion
- If `pool.connect()` fails in `writeSynthesis`, error is thrown but might not be logged clearly
- **Check:** Are there connection leaks? Is the pool size sufficient?

### 2. Database Schema Mismatch
- If `syntheses` table is missing columns or has wrong types, INSERT will fail
- **Check:** Does the `syntheses` table exist with all required columns?

### 3. JSON Serialization Failure
- If `confidence_breakdown` contains circular references or invalid JSON, `JSON.stringify()` will fail
- **Check:** Is `confidence_breakdown` always serializable?

### 4. Transaction Deadlock
- If another process locks the `analyses` table, the UPDATE will hang or timeout
- **Check:** Are there concurrent analyses running?

---

## 📋 WHAT TO CHECK IN SERVER LOGS

Look for these log messages in order:

1. `[ENGINE] Starting analysis` ✅ Should appear
2. `[ENGINE] Invoking lenses` ✅ Should appear
3. `[ENGINE] Lens invocation complete` ✅ Should appear
4. `[ENGINE] Running analysis pipeline` ✅ Should appear
5. `[ANALYSIS] Computing synthesis` ✅ Should appear
6. `[ANALYSIS] Synthesis computed` ⚠️ **Check if this appears and what confidence_score value is logged**
7. `[ANALYSIS] Writing synthesis` ⚠️ **Check if this appears**
8. `[ANALYSIS] Analysis complete` ❌ **If missing, writeSynthesis failed**
9. `[ANALYSIS] Analysis pipeline error` ❌ **If this appears, check the error message**

---

## 🛠️ IMMEDIATE FIXES NEEDED

1. **Fix log statement** (line 369) - Change to `engineOutput.synthesis.confidence_score`
2. **Add error logging in writeSynthesis** - Log the actual database error before re-throwing
3. **Add timeout handling** - If writeSynthesis hangs, it will block forever
