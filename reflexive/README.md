# REFLEXIVE Reasoning Engine

REFLEXIVE is an institutional reasoning engine that analyzes decision stimuli through multiple analytical lenses and synthesizes insights.

## API Usage

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "ok": true,
  "version": "0.1.0"
}
```

### Create Analysis (Dry Run)

```bash
curl -X POST http://localhost:3000/v1/analyses \
  -H "Content-Type: application/json" \
  -d '{
    "stimulus": {
      "text": "Should we acquire Company X for $500M? They have $200M annual revenue growing 15% YoY.",
      "type": "decision"
    },
    "options": {
      "dry_run": true
    }
  }'
```

### Create Analysis (Full Run)

```bash
curl -X POST http://localhost:3000/v1/analyses \
  -H "Content-Type: application/json" \
  -d '{
    "stimulus": {
      "text": "Should we acquire Company X for $500M? They have $200M annual revenue growing 15% YoY.",
      "type": "decision"
    },
    "context": {
      "documents": [
        {
          "doc_id": "doc-1",
          "title": "Market Analysis",
          "source": "user_upload",
          "excerpt": "Market conditions are favorable..."
        }
      ]
    }
  }'
```

### Get Analysis

```bash
curl http://localhost:3000/v1/analyses/{analysis_id}
```

### Get Artifacts

```bash
curl http://localhost:3000/v1/analyses/{analysis_id}/artifacts
```

### Get Demo Pack

```bash
curl http://localhost:3000/v1/analyses/{analysis_id}/demo-pack
```

Returns a consolidated view with summary, synthesis, artifacts, config snapshot, exec_summary, and redlines.

### Get Demo Pack (Text - 60-second read)

```bash
curl http://localhost:3000/v1/analyses/{analysis_id}/demo-pack.txt
```

Returns plain text executive summary suitable for email/WhatsApp sharing.

## Response Format

```json
{
  "analysis_id": "uuid",
  "created_at": "2026-02-08T13:00:00Z",
  "inputs": { ... },
  "run_metadata": {
    "duration_ms": 5000,
    "models": {
      "lens_llm": "gpt-4o",
      "embedder": "nomic-embed-text"
    },
    "engine_config_snapshot": { ... }
  },
  "lens_results": [
    {
      "lens": "analytical",
      "status": "ok",
      "raw_text": "...",
      "claim_ids": ["..."],
      "duration_ms": 2000
    }
  ],
  "claims": [
    {
      "claim_id": "uuid",
      "lens": "analytical",
      "text": "...",
      "provenance": {
        "lens_raw_ref": "perspective_id"
      }
    }
  ],
  "evidence": {
    "items": [],
    "links": []
  },
  "engine_output": {
    "synthesis": {
      "confidence_score": 0.5,
      "convergence_points": [],
      "divergence_points": [],
      "orphan_claims": []
    }
  },
  "warnings": []
}
```

## Auditability

REFLEXIVE provides complete traceability for every analysis:

### Raw Lens Outputs

Every successful lens invocation stores its raw text output in `lens_results[].raw_text`. This allows you to:
- Verify what the LLM actually produced
- Debug parsing or extraction issues
- Audit the reasoning process

### Claim Provenance

Every claim includes a `provenance.lens_raw_ref` that links it back to its source lens. The reference format is:
```
lens:<lens_name>:claim:<index>
```

Example:
```json
{
  "claim_id": "abc-123",
  "lens": "analytical",
  "text": "Company X has strong revenue growth",
  "provenance": {
    "lens_raw_ref": "lens:analytical:claim:0"
  }
}
```

### Config Snapshot

Every analysis response includes `run_metadata.engine_config_snapshot` containing the full `ENGINE_CONFIG` used for that run. This ensures:
- Reproducibility: same config = same results
- Audit trail: know exactly which weights/thresholds were applied
- Version tracking: config changes are visible in stored analyses

### Artifacts Endpoint

Use `GET /v1/analyses/:id/artifacts` to retrieve a normalized view of all traceability artifacts:

```bash
curl http://localhost:3000/v1/analyses/{analysis_id}/artifacts
```

This returns:
- `lens_artifacts`: All lens outputs with raw_text
- `claim_artifacts`: All claims with provenance links
- `evidence_artifacts`: Evidence items and links
- `config_snapshot`: Engine configuration used

The artifacts endpoint is read-only and derives its data from the stored analysis JSON, ensuring consistency.

## PWC Demo Flow

1. **Create an analysis:**
   ```bash
   curl -X POST http://localhost:3000/v1/analyses \
     -H "Content-Type: application/json" \
     -d '{
       "stimulus": {
         "text": "Should we acquire Company X for $500M?",
         "type": "decision"
       }
     }'
   ```
   Save the `analysis_id` from the response.

2. **Get demo pack:**
   ```bash
   curl http://localhost:3000/v1/analyses/{analysis_id}/demo-pack
   ```
   This returns a consolidated view with summary, synthesis, artifacts, and config.

3. **Export to files:**
   ```bash
   npm run demo:export -- --id {analysis_id} --out eval/demo/exports
   ```
   This creates four files:
   - `{analysis_id}.demo-pack.json` - Complete demo pack (with exec_summary and redlines)
   - `{analysis_id}.artifacts.json` - Traceability artifacts
   - `{analysis_id}.synthesis.json` - Engine synthesis output
   - `{analysis_id}.exec-summary.txt` - Plain text executive summary

## Development

```bash
# Run API server
npm run api:dev

# Run tests
npm test
npm run api:test

# Run golden cases
npm run eval:golden

# Export demo pack
npm run demo:export -- --id <analysis_id> --out <output_dir>
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `LLM_API_KEY` - OpenAI API key (required for full runs)
- `LLM_MODEL` - LLM model name (default: gpt-4o)
- `OLLAMA_EMBED_MODEL` - Embedding model (default: nomic-embed-text)
- `REFLEXIVE_API_TOKEN` - API authentication token (optional, for production)
- `PORT` - Server port (default: 3000)
