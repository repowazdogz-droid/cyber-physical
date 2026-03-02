"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AddMemberForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    membership_tier: "standard",
    membership_status: "pending",
    monthly_rate: "50",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.from("members").insert({
      email: form.email,
      full_name: form.full_name,
      phone: form.phone || null,
      membership_tier: form.membership_tier,
      membership_status: form.membership_status,
      monthly_rate: parseFloat(form.monthly_rate) || 50,
      notes: form.notes || null,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/admin/members");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Full name *</span>
        <input
          type="text"
          required
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Email *</span>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Phone</span>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Tier</span>
          <select
            value={form.membership_tier}
            onChange={(e) => setForm((f) => ({ ...f, membership_tier: e.target.value }))}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          >
            <option value="standard">Standard</option>
            <option value="pt_client">PT client</option>
            <option value="class_only">Class only</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Status</span>
          <select
            value={form.membership_status}
            onChange={(e) => setForm((f) => ({ ...f, membership_status: e.target.value }))}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="notice_period">Notice period</option>
            <option value="frozen">Frozen</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Monthly rate (£)</span>
        <input
          type="number"
          step="0.01"
          value={form.monthly_rate}
          onChange={(e) => setForm((f) => ({ ...f, monthly_rate: e.target.value }))}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Notes</span>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      {error && <p className="text-[#e63946] text-sm">{error}</p>}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Add member"}
        </button>
        <Link href="/admin/members" className="rounded-lg border border-[#3a3a3a] text-[#f1f1f1] px-4 py-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}
