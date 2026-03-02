// spine/sim/rng.ts

// Simple deterministic PRNG (Mulberry32)
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rand: () => number) {
  // Box–Muller
  const u1 = Math.max(1e-12, rand());
  const u2 = Math.max(1e-12, rand());
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}



































