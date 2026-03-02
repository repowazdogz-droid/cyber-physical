import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    anthropicProxy(),
  ],
  build: { outDir: 'dist', sourcemap: true },
});

/** Load .env into process.env for the proxy (Vite may not expose to server middleware). */
function loadEnv() {
  const dirs = [process.cwd(), resolve(process.cwd(), '..')];
  for (const dir of dirs) {
    const envPath = resolve(dir, '.env');
    if (!existsSync(envPath)) continue;
    try {
      const raw = readFileSync(envPath, 'utf8');
      raw.split('\n').forEach((line) => {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      });
    } catch (_) {}
  }
}

/** Dev-only: proxy Anthropic API to avoid CORS; API key stays server-side. */
function anthropicProxy() {
  return {
    name: 'anthropic-proxy',
    configureServer(server) {
      loadEnv();
      server.middlewares.use('/api/anthropic', (req, res, next) => {
        if (req.method !== 'POST' || !req.url?.startsWith('/v1/')) return next();
        const key = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (!key || key === 'sk-ant-...') {
          console.warn('\n[omega-terminal] VITE_ANTHROPIC_API_KEY missing or placeholder. Create .env in omega-terminal/ with:\n  VITE_ANTHROPIC_API_KEY=sk-ant-your-key\n');
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'API key not set. Create a .env file in the omega-terminal folder with: VITE_ANTHROPIC_API_KEY=sk-ant-your-key',
          }));
          return;
        }
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          const target = 'https://api.anthropic.com' + req.url;
          fetch(target, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': key,
              'anthropic-version': '2023-06-01',
            },
            body: body || undefined,
          })
            .then((r) => {
              res.statusCode = r.status;
              const skip = ['content-encoding', 'content-length', 'transfer-encoding'];
              r.headers.forEach((v, k) => {
                if (!skip.includes(k.toLowerCase())) res.setHeader(k, v);
              });
              return r.text();
            })
            .then((text) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(text);
            })
            .catch((err) => {
              console.error('[omega-terminal] Proxy error:', err.message);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Proxy error' }));
            });
        });
      });
    },
  };
}
