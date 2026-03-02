/**
 * Unit test for retry predicate logic
 * Tests the logic used in React Query retry configuration
 */

// Retry predicate function (extracted from useQuery config)
function shouldRetry(failureCount: number, err: any): boolean {
  // Don't retry on 409 or MISSING_SYNTHESIS_SCORE errors
  if (err?.code === 'MISSING_SYNTHESIS_SCORE' || err?.code?.startsWith('HTTP_409')) {
    return false
  }
  return failureCount < 2
}

describe('retry predicate', () => {
  it('should not retry on MISSING_SYNTHESIS_SCORE', () => {
    const err = { code: 'MISSING_SYNTHESIS_SCORE', message: 'Missing synthesis score' }
    expect(shouldRetry(0, err)).toBe(false)
    expect(shouldRetry(1, err)).toBe(false)
  })

  it('should not retry on HTTP_409 errors', () => {
    const err = { code: 'HTTP_409', message: 'Conflict' }
    expect(shouldRetry(0, err)).toBe(false)
    expect(shouldRetry(1, err)).toBe(false)
  })

  it('should not retry on HTTP_409_* variants', () => {
    const err = { code: 'HTTP_409_CONFLICT', message: 'Conflict' }
    expect(shouldRetry(0, err)).toBe(false)
  })

  it('should retry other errors up to 2 times', () => {
    const err = { code: 'HTTP_500', message: 'Server error' }
    expect(shouldRetry(0, err)).toBe(true)
    expect(shouldRetry(1, err)).toBe(true)
    expect(shouldRetry(2, err)).toBe(false)
  })

  it('should retry errors without code up to 2 times', () => {
    const err = { message: 'Network error' }
    expect(shouldRetry(0, err)).toBe(true)
    expect(shouldRetry(1, err)).toBe(true)
    expect(shouldRetry(2, err)).toBe(false)
  })
})
