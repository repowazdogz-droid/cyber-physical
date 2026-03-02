"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewSessionPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/session/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .then((r) => r.json())
      .then((d) => router.replace(d.sessionId ? `/session/${d.sessionId}` : "/"))
      .catch(() => router.replace("/"));
  }, [router]);
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-[var(--muted)] text-sm">Starting session…</p>
    </main>
  );
}
