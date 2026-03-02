/**
 * OMEGA Trust Terminal — Anthropic API wrapper
 * Dev: requests go through Vite proxy (/api/anthropic/...) so API key stays server-side (no CORS).
 * Production: use same path and run a backend proxy (e.g. Vercel serverless) that adds the key.
 */

const PROXY_PATH = "/api/anthropic/v1/messages";

function getApiUrl() {
  return PROXY_PATH;
}

export async function anthropicMessages(body, signal) {
  const url = getApiUrl();
  const headers = { "Content-Type": "application/json" };
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const text = await response.text();
    const status = response.status;
    let errMsg = "API " + status + ": " + response.statusText;
    try {
      const j = JSON.parse(text);
      if (j.error) errMsg = j.error;
    } catch (_) {}
    if (status === 429) {
      errMsg = "Rate limited (429). Try again in a few minutes.";
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        const sec = parseInt(retryAfter, 10);
        if (!Number.isNaN(sec)) errMsg += " Retry after " + sec + "s.";
      }
    }
    const err = new Error(errMsg);
    err.status = status;
    if (status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      err.retryAfterSec = retryAfter ? parseInt(retryAfter, 10) : 60;
      if (Number.isNaN(err.retryAfterSec)) err.retryAfterSec = 60;
    }
    throw err;
  }
  return response.json();
}

export function hasApiKey() {
  return true;
}
