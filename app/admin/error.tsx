// app/admin/error.tsx
"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Admin error</h1>
      <p style={{ marginBottom: 12 }}>Something failed in an admin route.</p>

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #ccc", borderRadius: 4 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Error</p>
        <pre style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          {error?.message ?? "Unknown error"}
        </pre>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={() => reset()}>Retry</button>
      </div>
    </main>
  );
}

