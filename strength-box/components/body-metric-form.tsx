"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addBodyMetric } from "@/lib/actions/body-metrics";

export function BodyMetricForm({ memberId }: { memberId?: string }) {
  const router = useRouter();
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await addBodyMetric({
      memberId,
      weightKg: weightKg === "" ? null : parseFloat(weightKg),
      bodyFatPercentage: bodyFat === "" ? null : parseFloat(bodyFat),
      notes: notes || null,
      recordedAt,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    setWeightKg("");
    setBodyFat("");
    setNotes("");
    setRecordedAt(new Date().toISOString().slice(0, 10));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 space-y-4"
    >
      <h3 className="font-medium text-[#f1f1f1]">Add measurement</h3>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Date</span>
        <input
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Weight (kg)</span>
        <input
          type="number"
          step="0.1"
          min="0"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="e.g. 72.5"
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Body fat (%)</span>
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={bodyFat}
          onChange={(e) => setBodyFat(e.target.value)}
          placeholder="e.g. 18"
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Notes</span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      {error && <p className="text-sm text-[#e63946]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
