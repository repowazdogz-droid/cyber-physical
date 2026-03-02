/**
 * OMEGA Trust Terminal — design tokens (source of truth from OmegaTrustTerminalDesign.jsx)
 */

export const T = {
  // Surfaces — layered darkness, not flat
  bg0: "#08090c",
  bg1: "#0d0f14",
  bg2: "#12151c",
  bg3: "#181c26",
  bg4: "#1e2330",

  border0: "#1a1e2a",
  border1: "#252a38",
  border2: "#333a4d",

  text0: "#e8eaf0",
  text1: "#a0a6b8",
  text2: "#6b7280",
  text3: "#3d4455",

  mint: "#5cffc8",
  mintDim: "#2a6b55",
  mintGlow: "rgba(92, 255, 200, 0.08)",

  amber: "#ffb347",
  amberDim: "#6b5a2a",
  amberGlow: "rgba(255, 179, 71, 0.08)",

  coral: "#ff6b6b",
  coralDim: "#6b2a2a",
  coralGlow: "rgba(255, 107, 107, 0.06)",

  blue: "#5fa8ff",
  blueDim: "#2a4a6b",
  blueGlow: "rgba(95, 168, 255, 0.08)",

  violet: "#a78bfa",
  violetDim: "#3d2a6b",
  violetGlow: "rgba(167, 139, 250, 0.08)",

  fontDisplay: "'DM Serif Display', 'Playfair Display', Georgia, serif",
  fontBody: "'IBM Plex Sans', 'Söhne', -apple-system, sans-serif",
  fontMono: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",

  space: (n) => n * 4,

  r1: 6,
  r2: 10,
  r3: 14,

  shadow1: "0 1px 3px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.3)",
  shadow2: "0 4px 16px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)",
  shadow3: "0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(0,0,0,0.4)",
  shadowGlow: (color) => `0 0 20px ${color}15, 0 0 60px ${color}08`,
};

export const noiseURL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`;

export const HYPO_STYLES = {
  constraint_flip: { color: T.violet, label: "CONSTRAINT FLIP", bg: "rgba(167,139,250,0.07)" },
  dimensional_shift: { color: T.blue, label: "DIMENSIONAL SHIFT", bg: "rgba(95,168,255,0.07)" },
  inversion: { color: T.coral, label: "INVERSION", bg: "rgba(255,107,107,0.07)" },
  collision: { color: T.amber, label: "COLLISION", bg: "rgba(255,179,71,0.07)" },
  absence: { color: T.mint, label: "ABSENCE DETECTOR", bg: "rgba(92,255,200,0.07)" },
};

export const POSTURE_COLORS = {
  Proceed: T.mint,
  Conditions: T.amber,
  Defer: T.blue,
  DNP: T.coral,
};
