"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Member = { id: string; full_name: string };

export function NewProgrammeForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [goal, setGoal] = useState("strength");
  const [durationWeeks, setDurationWeeks] = useState("12");
  const [dayName, setDayName] = useState("");
  const [exercises, setExercises] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: programme } = await supabase
      .from("programmes")
      .insert({
        member_id: memberId,
        name,
        goal,
        duration_weeks: durationWeeks ? parseInt(durationWeeks, 10) : null,
        notes: notes || null,
        active: true,
      })
      .select("id")
      .single();
    if (!programme?.id) {
      setLoading(false);
      return;
    }
    const { data: day } = await supabase
      .from("programme_days")
      .insert({ programme_id: programme.id, day_number: 1, name: dayName || "Day 1" })
      .select("id")
      .single();
    if (day?.id && exercises.trim()) {
      const lines = exercises.trim().split("\n").filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        await supabase.from("programme_exercises").insert({
          programme_day_id: day.id,
          exercise_name: lines[i],
          order_index: i,
        });
      }
    }
    setLoading(false);
    router.push("/admin/programmes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Programme name *</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Member *</span>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Goal</span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          >
            <option value="strength">Strength</option>
            <option value="hypertrophy">Hypertrophy</option>
            <option value="fat_loss">Fat loss</option>
            <option value="general_fitness">General fitness</option>
            <option value="rehabilitation">Rehabilitation</option>
            <option value="sport_specific">Sport specific</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Duration (weeks)</span>
          <input
            type="number"
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Day 1 name</span>
        <input
          type="text"
          value={dayName}
          onChange={(e) => setDayName(e.target.value)}
          placeholder="e.g. Upper A"
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Exercises (one per line)</span>
        <textarea
          value={exercises}
          onChange={(e) => setExercises(e.target.value)}
          rows={6}
          placeholder="Bench Press\nBarbell Row\nOverhead Press"
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-[#a0a0a0] text-sm">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create programme"}
      </button>
    </form>
  );
}
