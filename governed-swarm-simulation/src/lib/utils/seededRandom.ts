export const DEFAULT_SEED = 42

export interface SeededRandom {
  /**
   * Returns a floating point value in the range [0, 1).
   */
  next(): number
  /**
   * Returns a floating point value in the range [min, max).
   */
  nextInRange(min: number, max: number): number
  /**
   * Returns an integer in the range [0, maxExclusive).
   */
  nextInt(maxExclusive: number): number
}

export const createSeededRandom = (seed: number = DEFAULT_SEED): SeededRandom => {
  // Mulberry32 PRNG: deterministic, fast, and sufficient for simulation use.
  let state = seed >>> 0

  const next = () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296
    return result
  }

  const nextInRange = (min: number, max: number) => {
    if (max <= min) {
      throw new Error('max must be greater than min')
    }
    return min + (max - min) * next()
  }

  const nextInt = (maxExclusive: number) => {
    if (maxExclusive <= 0) {
      throw new Error('maxExclusive must be positive')
    }
    return Math.floor(next() * maxExclusive)
  }

  return {
    next,
    nextInRange,
    nextInt,
  }
}

