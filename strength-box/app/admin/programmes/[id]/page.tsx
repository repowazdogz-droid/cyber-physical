import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: programme } = await supabase
    .from("programmes")
    .select("id, name, goal, duration_weeks, notes, active, members(full_name)")
    .eq("id", id)
    .single();
  if (!programme) notFound();

  const { data: days } = await supabase
    .from("programme_days")
    .select("id, day_number, name")
    .eq("programme_id", id)
    .order("day_number");

  const dayIds = (days ?? []).map((d) => d.id);
  const { data: exercises } = dayIds.length
    ? await supabase
        .from("programme_exercises")
        .select("programme_day_id, exercise_name, sets, reps, rpe_target, order_index")
        .in("programme_day_id", dayIds)
        .order("order_index")
    : { data: [] };

  const byDay = new Map<string, { exercise_name: string; sets: number | null; reps: string | null; rpe_target: number | null }[]>();
  exercises?.forEach((e) => {
    const list = byDay.get(e.programme_day_id) ?? [];
    list.push({ exercise_name: e.exercise_name, sets: e.sets, reps: e.reps, rpe_target: e.rpe_target });
    byDay.set(e.programme_day_id, list);
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/programmes" className="text-[#c8a951] text-sm">← Programmes</Link>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-[#f1f1f1]">{programme.name}</h1>
          <p className="text-[#a0a0a0] text-sm mt-1">
            {(programme.members as { full_name?: string } | null)?.full_name} · {programme.goal ?? "—"} · {programme.duration_weeks ? `${programme.duration_weeks} weeks` : ""} · {programme.active ? "Active" : "Inactive"}
          </p>
        </div>
      </div>
      {programme.notes && <p className="text-[#a0a0a0] text-sm">{programme.notes}</p>}
      <div className="space-y-4">
        {(days ?? []).map((d) => (
          <div key={d.id} className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
            <h2 className="font-semibold text-[#c8a951] mb-2">Day {d.day_number} — {d.name ?? "Unnamed"}</h2>
            <ul className="space-y-1 text-sm text-[#f1f1f1]">
              {(byDay.get(d.id) ?? []).map((ex, i) => (
                <li key={i}>{ex.exercise_name} {ex.sets != null ? `· ${ex.sets}×` : ""} {ex.reps ?? ""} {ex.rpe_target != null ? `@ RPE ${ex.rpe_target}` : ""}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
