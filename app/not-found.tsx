// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>404</h1>
      <p style={{ marginBottom: 12 }}>This page could not be found.</p>
      <Link href="/">Go home</Link>
    </main>
  );
}

