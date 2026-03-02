/**
 * Vercel serverless proxy for Anthropic API (production).
 * Set ANTHROPIC_API_KEY in Vercel project environment.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(502).json({ error: "ANTHROPIC_API_KEY not configured" });
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body || {}),
    });
    const text = await r.text();
    res.status(r.status);
    r.headers.forEach((v, k) => res.setHeader(k, v));
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: e.message || "Proxy error" });
  }
}
