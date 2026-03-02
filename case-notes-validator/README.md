# Case Notes Validator

Observation-grounded, bias-aware, evidence-linked validator for residential care case notes.

- **Bias detection**: Flags absolute language, labelling, subjective inference, compliance framing, and more.
- **Evidence base**: Link observations, child's words, reported info, and context.
- **Quality score**: 0–100 with clear feedback and suggestions.
- **Export**: Download validated note as Markdown.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # preview production build
```

## Deploy (Vercel)

Build command: `npm run build`  
Output directory: `dist`  
Root directory: `.` (or `case-notes-validator` if in a monorepo)
