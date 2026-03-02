"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogPaymentForm({
  memberId,
  defaultAmount,
}: {
  memberId: string;
  defaultAmount: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [amount, setAmount] = useState(defaultAmount);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("payments").insert({
      member_id: memberId,
      amount: parseFloat(amount) || 0,
      payment_date: paymentDate,
      description: description || null,
      status: "paid",
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 space-y-4">
      <h3 className="font-medium text-[#f1f1f1]">Log payment</h3>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Amount (£)</span>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Date</span>
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. February membership"
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Log payment"}
      </button>
    </form>
  );
}
