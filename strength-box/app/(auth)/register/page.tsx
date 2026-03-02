"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
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
      <h1 className="text-xl font-bold text-[#f1f1f1] mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] placeholder-[#666] focus:border-[#c8a951] focus:outline-none"
            placeholder="Your name"
          />
        </label>
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
            minLength={6}
            className="mt-1 w-full rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] placeholder-[#666] focus:border-[#c8a951] focus:outline-none"
            placeholder="Min 6 characters"
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-[#a0a0a0] text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-[#c8a951]">
          Log in
        </Link>
      </p>
    </>
  );
}
