# OMEGA Trust Terminal

Bloomberg-style trust terminal for OMEGA's R&D and Decision engines. Runs locally with Vite and deploys to Vercel.

## Local development

1. **Install and run**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173

2. **API key (required for running pipelines)**
   Create a `.env` file in this folder (same folder as `package.json`):
   ```bash
   VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```
   Get a key from https://console.anthropic.com . Do not commit `.env` (it is gitignored).

   Restart `npm run dev` after creating or changing `.env`. If the key is missing or still the placeholder from `.env.example`, you'll see a 502 and the message: *"API key not set. Create a .env file..."* — and a warning in the terminal.

## Production (Vercel)

- Set **ANTHROPIC_API_KEY** in the Vercel project environment (no `VITE_` prefix).
- The `api/` serverless function proxies requests so the key is never sent to the browser.

## Build

```bash
npm run build
```
Output: `dist/`
