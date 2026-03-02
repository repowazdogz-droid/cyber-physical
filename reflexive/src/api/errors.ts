export enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_INPUT = 'INSUFFICIENT_INPUT',
  LENS_FAILURE = 'LENS_FAILURE',
  EMBEDDING_FAILURE = 'EMBEDDING_FAILURE',
  ENGINE_FAILURE = 'ENGINE_FAILURE',
  STORAGE_FAILURE = 'STORAGE_FAILURE',
  NOT_FOUND = 'NOT_FOUND',
  MISSING_SYNTHESIS_SCORE = 'MISSING_SYNTHESIS_SCORE',
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}
