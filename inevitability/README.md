# Inevitability

A minimal puzzle game where you change rules and reality reconfigures. Place logical constraints to make states inevitable, impossible, or possible.

## Tech

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion

## Run

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build
npx vercel
```

## Rules (plain English)

- **Can't coexist** — two states cannot both be present.
- **A needs B** — if A is present, B must be present.
- **At most K of these** — at most K states from the chosen set can be present.
- **Exactly K of these** — exactly K states from the chosen set must be present.

States are classified as **possible**, **inevitable**, or **impossible** based on all allowed worlds. The solver runs on every rule change for instant feedback.
