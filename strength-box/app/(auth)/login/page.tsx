"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/redirect-after-login");
    router.refresh();
  }

  return (
    <>
      <Link href="/" className="text-[#c8a951] text-sm mb-4 inline-block">
        ← Back
      </Link>
      <h1 className="text-xl font-bold text-[#f1f1f1] mb-6">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] placeholder-[#666] focus:border-[#c8a951] focus:outline-none"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] placeholder-[#666] focus:border-[#c8a951] focus:outline-none"
          />
        </label>
        {error && (
          <p className="text-[#e63946] text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="touch-target w-full rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold py-3 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-[#a0a0a0] text-sm">
        No account?{" "}
        <Link href="/register" className="text-[#c8a951]">
          Register
        </Link>
      </p>
    </>
  );
}
