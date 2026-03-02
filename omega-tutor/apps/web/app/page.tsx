"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    // Create anonymous session and go to session view
    fetch("/api/session/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .then((r) => r.json())
      .then((d) => {
        if (d.sessionId) router.push(`/session/${d.sessionId}`);
        else router.push("/session/new");
      })
      .catch(() => router.push("/session/new"));
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-xl font-medium text-[var(--text)] mb-2 text-center">
          Omega Tutor
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8 text-center">
          Teach me something you believe you understand.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe an idea or principle in your own words…"
            className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            rows={4}
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)] transition-colors text-sm font-medium"
          >
            Begin
          </button>
        </form>
      </div>
    </main>
  );
}
