// app/admin/not-found.tsx
import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main style={{ padding: 24, maxWidth: 760 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Admin: not found</h1>
      <p style={{ marginBottom: 12 }}>This admin page does not exist.</p>
      <div style={{ marginTop: 24 }}>
        <Link href="/admin">Back to admin</Link>
      </div>
    </main>
  );
}

