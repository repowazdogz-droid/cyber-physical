/**
 * LLM Status API
 * 
 * Returns whether LLM features are enabled.
 * 
 * Version: 1.0.0
 */

import { NextResponse } from 'next/server';
import { isGeminiEnabled, getGeminiApiKey } from '../../../../spine/llm/config/GeminiConfig';

export async function GET() {
  const enabled = isGeminiEnabled() && !!getGeminiApiKey();
  
  return NextResponse.json({
    enabled
  });
}







































