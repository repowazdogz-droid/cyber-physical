# Block 2 Verification Checks

## Test Scenarios

### 1. Headline Only
**Input:** `"AI will replace half of all jobs in 5 years"`

**Expected:**
- Status: 200
- Returns scaffold with 5 sections (summary, assumptions, evidence, constraints, tradeoffs)
- All sections populated (even if minimal)

**Verify:** Run manually or via API test tool

### 2. Short Paragraph (~800 chars)
**Input:** A paragraph of approximately 800 characters making a claim

**Expected:**
- Status: 200
- Returns scaffold with 5 sections
- Content reflects the paragraph's structure

**Verify:** Run manually or via API test tool

### 3. URL Pasted → Friendly Message + No API Call
**Input:** `https://example.com/article`

**Expected:**
- Status: 200 (not 400)
- Returns fallback scaffold
- `validationError: 'url_not_supported'` in response
- LLM is NOT called (check logs)
- User sees friendly message in UI

**Verify:** 
- Check server logs for no LLM call
- Check UI shows "URLs are not supported yet" message
- Check response has `fallback: true`

## Manual Verification Steps

1. **Headline test:**
   ```bash
   curl -X POST http://localhost:3001/api/explain/scaffold \
     -H "Content-Type: application/json" \
     -d '{"sourceContent": "AI will replace half of all jobs in 5 years"}'
   ```

2. **Paragraph test:**
   ```bash
   curl -X POST http://localhost:3001/api/explain/scaffold \
     -H "Content-Type: application/json" \
     -d '{"sourceContent": "[800 char paragraph]"}'
   ```

3. **URL test:**
   ```bash
   curl -X POST http://localhost:3001/api/explain/scaffold \
     -H "Content-Type: application/json" \
     -d '{"sourceContent": "https://example.com/article"}'
   ```

## UI Verification

- Placeholder text shows "max 2,000 characters. URLs not supported yet."
- Character counter shows "X / 2000"
- Pasting URL shows error message and prevents submission
- Pasting >2000 chars shows error message and prevents submission
- All valid inputs produce 5-section output




























