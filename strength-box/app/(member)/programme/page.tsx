import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MemberProgrammePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: member } = await supabase.from("members").select("id").eq("user_id", user.id).single();
  if (!member) {
    return (
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-6">
        <p className="text-[#a0a0a0]">Membership pending.</p>
      </div>
    );
  }

  const { data: programme } = await supabase
    .from("programmes")
    .select("id, name, goal, duration_weeks, notes")
    .eq("member_id", member.id)
    .eq("active", true)
    .limit(1)
    .single();

  if (!programme) {
    return (
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-6">
        <h1 className="text-xl font-bold text-[#f1f1f1]">Programme</h1>
        <p className="text-[#a0a0a0] mt-2">No active programme assigned. Ask your coach.</p>
      </div>
    );
  }

  const { data: days } = await supabase
    .from("programme_days")
    .select("id, day_number, name")
    .eq("programme_id", programme.id)
    .order("day_number");

  const dayIds = (days ?? []).map((d) => d.id);
  const { data: exercises } = dayIds.length
    ? await supabase
        .from("programme_exercises")
        .select("programme_day_id, exercise_name, sets, reps, rpe_target, order_index")
        .in("programme_day_id", dayIds)
        .order("order_index")
    : { data: [] };

  const exercisesByDay = new Map<string, { exercise_name: string; sets: number | null; reps: string | null; rpe_target: number | null }[]>();
  exercises?.forEach((e) => {
    const list = exercisesByDay.get(e.programme_day_id) ?? [];
    list.push({
      exercise_name: e.exercise_name,
      sets: e.sets,
      reps: e.reps,
      rpe_target: e.rpe_target,
    });
    exercisesByDay.set(e.programme_day_id, list);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">{programme.name}</h1>
      {(programme.goal || programme.duration_weeks) && (
        <p className="text-[#a0a0a0] text-sm">
          {programme.goal ?? ""} {programme.duration_weeks ? `· ${programme.duration_weeks} weeks` : ""}
        </p>
      )}
      {programme.notes && <p className="text-[#a0a0a0] text-sm">{programme.notes}</p>}
      <div className="space-y-4">
        {(days ?? []).map((d) => (
          <div key={d.id} className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
            <h2 className="font-semibold text-[#c8a951] mb-2">
              Day {d.day_number} — {d.name ?? "Unnamed"}
            </h2>
            <ul className="space-y-2 text-sm">
              {(exercisesByDay.get(d.id) ?? []).map((ex, i) => (
                <li key={i} className="text-[#f1f1f1]">
                  {ex.exercise_name}
                  <span className="text-[#a0a0a0] ml-2">
                    {ex.sets != null ? `${ex.sets}×` : ""} {ex.reps ?? ""} {ex.rpe_target != null ? `@ RPE ${ex.rpe_target}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
