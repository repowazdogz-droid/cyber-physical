import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase.from("members").select("id").eq("user_id", user.id).single();
  if (!member) return null;

  const { data: log } = await supabase
    .from("workout_logs")
    .select("id, logged_at, duration_minutes, overall_rpe, energy_level, sleep_quality, notes")
    .eq("id", id)
    .eq("member_id", member.id)
    .single();
  if (!log) notFound();

  const { data: exerciseLogs } = await supabase
    .from("exercise_logs")
    .select("exercise_name, set_number, weight_kg, reps, rpe, personal_record")
    .eq("workout_log_id", id)
    .order("exercise_name")
    .order("set_number");

  const byExercise = new Map<string, { set_number: number | null; weight_kg: number | null; reps: number | null; rpe: number | null; personal_record: boolean }[]>();
  exerciseLogs?.forEach((e) => {
    const list = byExercise.get(e.exercise_name) ?? [];
    list.push({
      set_number: e.set_number,
      weight_kg: e.weight_kg,
      reps: e.reps,
      rpe: e.rpe,
      personal_record: e.personal_record,
    });
    byExercise.set(e.exercise_name, list);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">
        {new Date(log.logged_at).toLocaleDateString("en-GB", { dateStyle: "long" })}
      </h1>
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 flex gap-4 flex-wrap text-sm">
        <span className="text-[#a0a0a0]">Duration: <span className="text-[#f1f1f1]">{log.duration_minutes ?? "—"} min</span></span>
        <span className="text-[#a0a0a0]">RPE: <span className="text-[#f1f1f1]">{log.overall_rpe ?? "—"}</span></span>
        <span className="text-[#a0a0a0]">Energy: <span className="text-[#f1f1f1]">{log.energy_level ?? "—"}</span></span>
        <span className="text-[#a0a0a0]">Sleep: <span className="text-[#f1f1f1]">{log.sleep_quality ?? "—"}</span></span>
      </div>
      {log.notes && <p className="text-[#a0a0a0] text-sm">{log.notes}</p>}
      <div className="space-y-4">
        {Array.from(byExercise.entries()).map(([name, sets]) => (
          <div key={name} className="rounded-xl border border-[#3a3a3a] p-4">
            <h3 className="font-medium text-[#c8a951] mb-2">{name}</h3>
            <ul className="space-y-1 text-sm">
              {sets.map((s, i) => (
                <li key={i} className="flex justify-between text-[#f1f1f1]">
                  <span>Set {s.set_number}</span>
                  <span>{s.weight_kg != null ? `${s.weight_kg} kg` : ""} × {s.reps ?? "—"} reps{s.rpe != null ? ` @ RPE ${s.rpe}` : ""}{s.personal_record ? " PR" : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
