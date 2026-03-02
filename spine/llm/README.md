# LLM Integration (Gemini 3 Flash)

Bounded, non-authoritative LLM assistance layer for drafting specs, explaining runs, and generating discussion questions.

## Safety Constraints

- **No autonomy**: LLM outputs are suggestions only, never directly modify artifacts or make decisions
- **Bounded outputs**: All outputs are truncated to safe limits (max 2000 chars, arrays bounded)
- **Feature flag**: Default OFF, requires explicit opt-in via `GEMINI_ENABLED=true`
- **Server-side only**: API key never exposed to browser
- **No tool usage**: Disabled function calling, code execution, and tool usage

## Configuration

### Environment Variables

```bash
# Required to enable LLM features
GEMINI_ENABLED=true

# Required API key from Google AI Studio
GEMINI_API_KEY=your_api_key_here

# Optional: model name (default: gemini-3-flash)
GEMINI_MODEL=gemini-3-flash
```

### Enabling the Feature

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set environment variables:
   ```bash
   export GEMINI_ENABLED=true
   export GEMINI_API_KEY=your_key_here
   ```
3. Restart the server

## API Endpoints

### POST `/api/llm/specDraft`

Drafts a KernelSpec from text description.

**Request:**
```json
{
  "text": "A kernel that evaluates landing safety for UAVs based on altitude, battery, GPS signal, and weather"
}
```

**Response:**
```json
{
  "ok": true,
  "specDraft": { ... },
  "validation": {
    "ok": true,
    "errors": [],
    "warnings": []
  }
}
```

**Bounds:**
- Input text: max 20,000 chars (truncated with warning)
- Output: max 2,000 chars

### POST `/api/llm/explain`

Generates explanations for kernel runs, regression diffs, or discussion questions.

**Request:**
```json
{
  "kind": "kernelRun",
  "payload": {
    "outcome": "SAFE_LANDING",
    "claims": ["Battery sufficient", "GPS signal strong"],
    "policyNotes": ["Policy check passed"]
  }
}
```

**Response (kernelRun/regressionDiff):**
```json
{
  "ok": true,
  "bullets": [
    "Outcome: SAFE_LANDING",
    "Key claim: Battery sufficient for landing",
    ...
  ]
}
```

**Response (questions):**
```json
{
  "ok": true,
  "questions": [
    "What factors influenced the landing decision?",
    ...
  ]
}
```

**Bounds:**
- Payload: max 50KB JSON
- Kernel run explanation: max 900 chars, 5-8 bullets
- Regression diff: max 600 chars, 3-6 bullets
- Questions: max 5 questions, each ≤ 120 chars

## Implementation Details

### Output Bounding

All LLM outputs are bounded:
- Strings: truncated to max length with `...` suffix
- Arrays: limited to max items (e.g., 8 bullets, 5 questions)
- JSON: validated and sanitized (markdown fences removed)

### Retry Logic

- Max 2 attempts
- If JSON parse fails, retry with stricter "RETURN VALID JSON ONLY" instruction
- Errors returned after max retries

### Prompt Safety

All prompts include:
- "No speculation" instructions
- Bounded output requirements
- JSON-only instructions where applicable
- No tool/function calling allowed

## Testing

Run tests:
```bash
npm test -- spine/llm
npm test -- app/api/llm
```

## Limitations

- LLM outputs are suggestions only, not authoritative
- No direct artifact modification
- Requires explicit user action to use LLM outputs
- Feature flag must be enabled
- API key required







































