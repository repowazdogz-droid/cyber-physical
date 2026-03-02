// app/error.tsx
"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
      <p style={{ marginBottom: 12 }}>
        {error?.message || "Unknown error"}
      </p>
      {error?.digest ? (
        <p style={{ opacity: 0.7, marginBottom: 12 }}>Digest: {error.digest}</p>
      ) : null}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => reset()}>Try again</button>
        <Link href="/">Go home</Link>
      </div>
    </main>
  );
}

