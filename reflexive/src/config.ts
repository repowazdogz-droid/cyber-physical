import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first (higher priority), then .env
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config();

// Environment variables
export const DATABASE_URL = process.env.DATABASE_URL;
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
export const EMBED_DIMENSIONS = parseInt(process.env.EMBED_DIMENSIONS || '768', 10);
export const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o';
export const LLM_API_KEY = process.env.LLM_API_KEY;
export const LLM_API_BASE_URL = process.env.LLM_API_BASE_URL || 'https://api.openai.com';
export const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '120000', 10);
export const LLM_MAX_RETRIES = parseInt(process.env.LLM_MAX_RETRIES || '2', 10);
export const LLM_RETRY_DELAY_MS = parseInt(process.env.LLM_RETRY_DELAY_MS || '1000', 10);

// Validate required env vars
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// LLM_API_KEY is optional for health checks and migrations
// It's only required when actually calling the LLM API

// Engine configuration constants (Artifact 04 §6.1)
export const ENGINE_CONFIG = {
  W_a: 0.35,
  W_e: 0.35,
  W_u: 0.15,
  W_d: 0.15,
  SIM_MATCH: 0.96,
  SIM_REJECT: 0.90,
  QUANT_DIFF: 0.50,
  UNSUPPORTED_EXPIRY_DAYS: 30,
  EVIDENCE_RECENCY_DAYS: 365,
  EVIDENCE_RECENCY_FLOOR: 0.30,
  STALE_EVIDENCE_MULT: 0.50,
  SCOPE_SIM_CEILING: 0.70,
  LOW_EVIDENCE_WARN: 0.10,
  HIGH_CONTRA_WARN: 0.50,
  DRIFT_LARGE_DELTA: 0.25,
  DRIFT_CHURN_STABILITY: 0.40,
  DRIFT_CHURN_SCORE: 0.10,
  DRIFT_DECAY_COUNT: 3,
  MIN_LENS_COUNT: 3,
  BORDERLINE_OVERLAP_CHARS: 20,
  // Band boundaries for confidence scores
  BAND_LOW_MAX: 0.25,
  BAND_MODERATE_MAX: 0.50,
  BAND_HIGH_MAX: 0.75,
  EVIDENCE_BASE_STRENGTH: {
    stimulus_quote: 0.8,
    context_excerpt: 0.7,
    numeric_data: 0.9,
    external_citation: 0.6,
    lens_inference: 0.3,
    stimulus_derived: 0.55,
  },
} as const;
