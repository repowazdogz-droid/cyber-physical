"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ProgrammeDay = { id: string; day_number: number; name: string | null };

export function LogWorkoutForm({
  memberId,
  programmeDays,
  programmeName,
}: {
  memberId: string;
  programmeDays: ProgrammeDay[];
  programmeName?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"choose" | "log">("choose");
  const [programmeDayId, setProgrammeDayId] = useState<string | null>(null);
  const [freestyle, setFreestyle] = useState(false);
  const [duration, setDuration] = useState("");
  const [overallRpe, setOverallRpe] = useState("");
  const [energy, setEnergy] = useState("");
  const [sleep, setSleep] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<{ name: string; sets: { weight: string; reps: string; rpe: string }[] }[]>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [loading, setLoading] = useState(false);

  function addExercise() {
    if (!newExerciseName.trim()) return;
    setExercises((e) => [...e, { name: newExerciseName.trim(), sets: [{ weight: "", reps: "", rpe: "" }] }]);
    setNewExerciseName("");
  }

  function addSet(idx: number) {
    setExercises((e) => {
      const next = [...e];
      next[idx] = { ...next[idx], sets: [...next[idx].sets, { weight: "", reps: "", rpe: "" }] };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: workoutLog } = await supabase
      .from("workout_logs")
      .insert({
        member_id: memberId,
        programme_day_id: programmeDayId || null,
        duration_minutes: duration ? parseInt(duration, 10) : null,
        overall_rpe: overallRpe ? parseFloat(overallRpe) : null,
        energy_level: energy ? parseFloat(energy) : null,
        sleep_quality: sleep ? parseFloat(sleep) : null,
        notes: notes || null,
      })
      .select("id")
      .single();
    if (workoutLog?.id && exercises.length > 0) {
      for (const ex of exercises) {
        for (let i = 0; i < ex.sets.length; i++) {
          const s = ex.sets[i];
          await supabase.from("exercise_logs").insert({
            workout_log_id: workoutLog.id,
            exercise_name: ex.name,
            set_number: i + 1,
            weight_kg: s.weight ? parseFloat(s.weight) : null,
            reps: s.reps ? parseInt(s.reps, 10) : null,
            rpe: s.rpe ? parseFloat(s.rpe) : null,
          });
        }
      }
    }
    setLoading(false);
    router.push("/workouts");
    router.refresh();
  }

  if (step === "choose") {
    return (
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 space-y-4">
        <p className="text-[#a0a0a0] text-sm">Choose programme day or log freestyle.</p>
        {programmeDays.length > 0 && programmeName && (
          <div>
            <p className="text-[#f1f1f1] font-medium mb-2">{programmeName}</p>
            <ul className="space-y-2">
              {programmeDays.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setProgrammeDayId(d.id);
                      setStep("log");
                    }}
                    className="touch-target w-full text-left rounded-lg border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] hover:border-[#c8a951]"
                  >
                    Day {d.day_number} — {d.name ?? "Unnamed"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setFreestyle(true);
            setStep("log");
          }}
          className="touch-target w-full rounded-lg border border-[#c8a951]/60 text-[#c8a951] px-4 py-3"
        >
          Freestyle workout
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 space-y-3">
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Duration (min)</span>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="text-[#a0a0a0] text-xs">RPE</span>
            <input
              type="number"
              min="1"
              max="10"
              step="0.5"
              value={overallRpe}
              onChange={(e) => setOverallRpe(e.target.value)}
              className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-3 py-2 text-[#f1f1f1]"
            />
          </label>
          <label className="block">
            <span className="text-[#a0a0a0] text-xs">Energy</span>
            <input
              type="number"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-3 py-2 text-[#f1f1f1]"
            />
          </label>
          <label className="block">
            <span className="text-[#a0a0a0] text-xs">Sleep</span>
            <input
              type="number"
              min="1"
              max="10"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-3 py-2 text-[#f1f1f1]"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-[#a0a0a0] text-sm">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-3 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
        </label>
      </div>

      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
        <h3 className="font-medium text-[#f1f1f1] mb-3">Exercises</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExercise())}
            placeholder="Exercise name"
            className="flex-1 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] px-4 py-2 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
          />
          <button type="button" onClick={addExercise} className="rounded-lg bg-[#c8a951] text-[#1a1a1a] px-4 py-2 font-medium">
            Add
          </button>
        </div>
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="mb-4 rounded-lg border border-[#3a3a3a] p-3">
            <p className="font-medium text-[#c8a951] mb-2">{ex.name}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#a0a0a0]">
                  <th className="text-left py-1">Set</th>
                  <th className="text-left py-1">Weight (kg)</th>
                  <th className="text-left py-1">Reps</th>
                  <th className="text-left py-1">RPE</th>
                </tr>
              </thead>
              <tbody>
                {ex.sets.map((s, setIdx) => (
                  <tr key={setIdx}>
                    <td className="py-1 text-[#f1f1f1]">{setIdx + 1}</td>
                    <td className="py-1">
                      <input
                        type="number"
                        step="0.5"
                        value={s.weight}
                        onChange={(e) => {
                          setExercises((prev) => {
                            const n = [...prev];
                            n[exIdx].sets[setIdx] = { ...n[exIdx].sets[setIdx], weight: e.target.value };
                            return n;
                          });
                        }}
                        className="w-16 rounded bg-[#1a1a1a] border border-[#3a3a3a] px-2 py-1 text-[#f1f1f1]"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) => {
                          setExercises((prev) => {
                            const n = [...prev];
                            n[exIdx].sets[setIdx] = { ...n[exIdx].sets[setIdx], reps: e.target.value };
                            return n;
                          });
                        }}
                        className="w-14 rounded bg-[#1a1a1a] border border-[#3a3a3a] px-2 py-1 text-[#f1f1f1]"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={s.rpe}
                        onChange={(e) => {
                          setExercises((prev) => {
                            const n = [...prev];
                            n[exIdx].sets[setIdx] = { ...n[exIdx].sets[setIdx], rpe: e.target.value };
                            return n;
                          });
                        }}
                        className="w-12 rounded bg-[#1a1a1a] border border-[#3a3a3a] px-2 py-1 text-[#f1f1f1]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={() => addSet(exIdx)} className="mt-2 text-sm text-[#c8a951]">
              + Add set
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-3 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Save workout"}
        </button>
        <Link href="/workouts" className="rounded-lg border border-[#3a3a3a] text-[#f1f1f1] px-4 py-3">
          Cancel
        </Link>
      </div>
    </form>
  );
}
