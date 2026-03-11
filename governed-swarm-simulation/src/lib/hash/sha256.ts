// Minimal SHA-256 implementation for deterministic in-browser hashing.
// Adapted to be self-contained and synchronous for simulation use.

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
  0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
  0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
  0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
  0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
  0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
  0xc67178f2,
])

const ROTR = (n: number, x: number) => (x >>> n) | (x << (32 - n))
const Ch = (x: number, y: number, z: number) => (x & y) ^ (~x & z)
const Maj = (x: number, y: number, z: number) => (x & y) ^ (x & z) ^ (y & z)
const Sigma0 = (x: number) => ROTR(2, x) ^ ROTR(13, x) ^ ROTR(22, x)
const Sigma1 = (x: number) => ROTR(6, x) ^ ROTR(11, x) ^ ROTR(25, x)
const sigma0 = (x: number) => ROTR(7, x) ^ ROTR(18, x) ^ (x >>> 3)
const sigma1 = (x: number) => ROTR(17, x) ^ ROTR(19, x) ^ (x >>> 10)

const toUtf8Bytes = (input: string): Uint8Array => {
  return new TextEncoder().encode(input)
}

export const sha256Hex = (input: string): string => {
  const bytes = toUtf8Bytes(input)
  const length = bytes.length

  const withPadding = new Uint8Array(((length + 9 + 63) >> 6) << 6)
  withPadding.set(bytes)
  withPadding[length] = 0x80

  const bitLen = length * 8
  const view = new DataView(withPadding.buffer)
  view.setUint32(withPadding.length - 4, bitLen, false)

  let h0 = 0x6a09e667
  let h1 = 0xbb67ae85
  let h2 = 0x3c6ef372
  let h3 = 0xa54ff53a
  let h4 = 0x510e527f
  let h5 = 0x9b05688c
  let h6 = 0x1f83d9ab
  let h7 = 0x5be0cd19

  const w = new Uint32Array(64)

  for (let i = 0; i < withPadding.length; i += 64) {
    for (let t = 0; t < 16; t += 1) {
      w[t] = view.getUint32(i + t * 4, false)
    }
    for (let t = 16; t < 64; t += 1) {
      w[t] = (sigma1(w[t - 2]) + w[t - 7] + sigma0(w[t - 15]) + w[t - 16]) | 0
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    let f = h5
    let g = h6
    let h = h7

    for (let t = 0; t < 64; t += 1) {
      const T1 = (h + Sigma1(e) + Ch(e, f, g) + K[t] + w[t]) | 0
      const T2 = (Sigma0(a) + Maj(a, b, c)) | 0
      h = g
      g = f
      f = e
      e = (d + T1) | 0
      d = c
      c = b
      b = a
      a = (T1 + T2) | 0
    }

    h0 = (h0 + a) | 0
    h1 = (h1 + b) | 0
    h2 = (h2 + c) | 0
    h3 = (h3 + d) | 0
    h4 = (h4 + e) | 0
    h5 = (h5 + f) | 0
    h6 = (h6 + g) | 0
    h7 = (h7 + h) | 0
  }

  const hash = new Uint32Array([h0, h1, h2, h3, h4, h5, h6, h7])
  let hex = ''
  for (let i = 0; i < hash.length; i += 1) {
    hex += hash[i].toString(16).padStart(8, '0')
  }
  return hex
}

