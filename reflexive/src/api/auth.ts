import { ApiError, ErrorCode } from './errors.js';

const API_TOKEN = process.env.REFLEXIVE_API_TOKEN;

export function requireAuth(authHeader?: string): void {
  if (!API_TOKEN) {
    // Local dev - no auth required
    return;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, 'Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7);
  if (token !== API_TOKEN) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, 'Invalid API token');
  }
}
