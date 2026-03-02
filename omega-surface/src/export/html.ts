/**
 * Export sealed artifact as self-verifying HTML.
 * Embeds artifact as JSON and a small script that runs verifyEnvelope and shows result.
 * Implement later: inject verifyEnvelope implementation or load omega-surface in browser.
 */

import type { ArtifactEnvelope } from '../artifact/types.js';
import { exportAsJson } from './json.js';

export function exportAsHtml(envelope: ArtifactEnvelope<unknown>): string {
  const payload = exportAsJson(envelope);
  const escaped = payload
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OMEGA Artifact — ${envelope.artifact_type}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; }
    .result { padding: 0.75rem; border-radius: 6px; margin: 1rem 0; }
    .result.valid { background: #d1fae5; color: #065f46; }
    .result.invalid { background: #fee2e2; color: #991b1b; }
    pre { overflow: auto; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>OMEGA Artifact</h1>
  <p><strong>Type:</strong> ${envelope.artifact_type} · <strong>ID:</strong> ${envelope.artifact_id}</p>
  <div id="verify-result" class="result">Verifying…</div>
  <details>
    <summary>Artifact JSON</summary>
    <pre id="artifact-json"></pre>
  </details>
  <script type="module">
    const envelope = JSON.parse(\`${escaped}\`);
    document.getElementById('artifact-json').textContent = JSON.stringify(envelope, null, 2);
    async function verify() {
      const contentHash = async (str) => {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      };
      const canonicalise = (obj) => {
        if (obj === null) return 'null';
        if (typeof obj === 'boolean') return String(obj);
        if (typeof obj === 'number') return Number.isFinite(obj) ? (Object.is(obj, -0) ? '0' : String(obj)) : 'null';
        if (typeof obj === 'string') return JSON.stringify(obj);
        if (Array.isArray(obj)) return '[' + obj.map(canonicalise).join(',') + ']';
        if (typeof obj === 'object') {
          const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
          return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalise(obj[k])).join(',') + '}';
        }
        return 'null';
      };
      const expected = await contentHash(canonicalise(envelope.content));
      const valid = expected === envelope._integrity.content_hash && envelope._integrity.chain.every((l, i) => {
        const prev = i === 0 ? '0' : envelope._integrity.chain[i - 1].content_hash;
        return l.prev_hash === prev;
      });
      const el = document.getElementById('verify-result');
      el.textContent = valid ? 'Integrity valid.' : 'Integrity check failed (content or chain mismatch).';
      el.className = 'result ' + (valid ? 'valid' : 'invalid');
    }
    verify();
  </script>
</body>
</html>`;
}
