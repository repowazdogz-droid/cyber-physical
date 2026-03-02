"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Member, MembershipTier, MembershipStatus } from "@/types/database";

export function EditMemberForm({ member }: { member: Member }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: member.email,
    full_name: member.full_name,
    phone: member.phone ?? "",
    date_of_birth: member.date_of_birth ?? "",
    emergency_contact_name: member.emergency_contact_name ?? "",
    emergency_contact_phone: member.emergency_contact_phone ?? "",
    membership_tier: member.membership_tier,
    membership_status: member.membership_status,
    membership_start: member.membership_start ?? "",
    notice_given_date: member.notice_given_date ?? "",
    monthly_rate: String(member.monthly_rate),
    notes: member.notes ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase
      .from("members")
      .update({
        email: form.email,
        full_name: form.full_name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        membership_tier: form.membership_tier,
        membership_status: form.membership_status,
        membership_start: form.membership_start || null,
        notice_given_date: form.notice_given_date || null,
        monthly_rate: parseFloat(form.monthly_rate) || 50,
        notes: form.notes || null,
      })
      .eq("id", member.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(`/admin/members/${member.id}`);
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
          <span className="text-[#a0a0a0] text-sm">Membership start</span>
          <input
            type="date"
            value={form.membership_start}
            onChange={(e) => setForm((f) => ({ ...f, membership_start: e.target.value }))}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Notice given</span>
          <input
            type="date"
            value={form.notice_given_date}
            onChange={(e) => setForm((f) => ({ ...f, notice_given_date: e.target.value }))}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Emergency contact</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={form.emergency_contact_name}
            onChange={(e) => setForm((f) => ({ ...f, emergency_contact_name: e.target.value }))}
            placeholder="Name"
            className="rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
          <input
            type="tel"
            value={form.emergency_contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))}
            placeholder="Phone"
            className="rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
        </div>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Tier</span>
          <select
            value={form.membership_tier}
            onChange={(e) => setForm((f) => ({ ...f, membership_tier: e.target.value as MembershipTier }))}
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
            onChange={(e) => setForm((f) => ({ ...f, membership_status: e.target.value as MembershipStatus }))}
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
          rows={3}
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
          {loading ? "Saving…" : "Save"}
        </button>
        <Link href={`/admin/members/${member.id}`} className="rounded-lg border border-[#3a3a3a] text-[#f1f1f1] px-4 py-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}
