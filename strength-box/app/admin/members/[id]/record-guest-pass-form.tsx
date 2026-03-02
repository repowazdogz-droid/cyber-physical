"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordGuestPass } from "@/lib/actions/guest-pass";

export function RecordGuestPassForm({
  memberId,
  usedFreeThisMonth,
  currentMonthLabel,
}: {
  memberId: string;
  usedFreeThisMonth: boolean;
  currentMonthLabel: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<"monthly_free" | "friend_friday">("monthly_free");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await recordGuestPass(memberId, type, guestName || undefined);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    setGuestName("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 space-y-4"
    >
      <h3 className="font-medium text-[#f1f1f1]">Record guest pass</h3>
      {usedFreeThisMonth && (
        <p className="text-sm text-[#c8a951]">
          Free pass for {currentMonthLabel} already used. Use Friend Friday (£1) to add another.
        </p>
      )}
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "monthly_free" | "friend_friday")}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        >
          <option value="monthly_free" disabled={usedFreeThisMonth}>
            Monthly free {usedFreeThisMonth ? `(used for ${currentMonthLabel})` : ""}
          </option>
          <option value="friend_friday">Friend Friday (£1)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Guest name (optional)</span>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="e.g. Jane"
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      {error && <p className="text-sm text-[#e63946]">{error}</p>}
      <button
        type="submit"
        disabled={loading || (type === "monthly_free" && usedFreeThisMonth)}
        className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Record pass"}
      </button>
    </form>
  );
}
