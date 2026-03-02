# REFLEXIVE UI

Institutional-grade analysis platform interface.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- Zod

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_API_TOKEN=your-token-here
   ```
   
   Note: If `NEXT_PUBLIC_API_TOKEN` is empty, the UI will work but API calls may fail if the backend requires auth.

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3001](http://localhost:3001) (or the port shown)

4. **Ensure the REFLEXIVE API server is running:**
   ```bash
   cd ../reflexive
   npm run api:dev
   ```

## Project Structure

```
/app
  /analyses
    page.tsx              # Analyses table
    /[id]
      page.tsx            # Analysis viewer
/components
  analyses-table.tsx      # Professional table component
  executive-summary.tsx   # Confidence & metrics display
  new-analysis-modal.tsx # Create analysis modal
  redlines-section.tsx    # Convergence/divergence/gaps
  traceability-panel.tsx  # Collapsible audit panel
  json-viewer.tsx        # Formatted JSON display
/lib
  api.ts                 # API client with React Query
```

## Features

- **Analyses Table**: Professional table with confidence scores, bands, and counts
- **Analysis Viewer**: Executive summary with large typography + traceability panel
- **New Analysis Modal**: Create analyses with stimulus text and type selection
- **Redlines Display**: Grouped convergence, divergence, and evidence gaps
- **Traceability Panel**: Collapsible sections for lenses, claims, evidence, config, models
- **Skeleton Loaders**: Zero layout shift during loading
- **Copy-to-Clipboard**: Click to copy analysis IDs

## Design Philosophy

- Severe, high-trust, executive-grade
- Pure white background (`#ffffff`)
- Near-black text (`#0a0a0a`)
- Zero gradients or bright colors
- Spacing over decoration
- Inter font family
- Large typography (6xl for confidence)
- Sharp corners (no rounded buttons)
- Muted badge colors (gray/blue/green/black)

Think: financial terminal, not marketing site.

## API Endpoints Used

- `GET /v1/analyses` - List all analyses
- `GET /v1/analyses/:id/demo-pack` - Get analysis demo pack
- `POST /v1/analyses` - Create new analysis
