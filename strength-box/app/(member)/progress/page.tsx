import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MemberProgressPage() {
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

  const workoutLogsRes = await supabase
    .from("workout_logs")
    .select("id, logged_at, duration_minutes, overall_rpe")
    .eq("member_id", member.id)
    .order("logged_at", { ascending: false })
    .limit(30);
  const workoutLogs = workoutLogsRes.data ?? [];
  const workoutIds = workoutLogs.map((w) => w.id);

  const [prsRes, bodyMetricsRes] = await Promise.all([
    workoutIds.length > 0
      ? supabase.from("exercise_logs").select("exercise_name, weight_kg, reps").in("workout_log_id", workoutIds).eq("personal_record", true).limit(20)
      : { data: [] as { exercise_name: string; weight_kg: number | null; reps: number | null }[] },
    supabase.from("body_metrics").select("recorded_at, weight_kg, body_fat_percentage").eq("member_id", member.id).order("recorded_at", { ascending: false }).limit(10),
  ]);

  const prs = prsRes.data ?? [];
  const bodyMetrics = bodyMetricsRes.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Progress</h1>
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Personal records</h2>
        {prs.length > 0 ? (
          <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
            {prs.map((p, i) => (
              <li key={i} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">{p.exercise_name}</span>
                <span className="text-[#c8a951]">{p.weight_kg} kg × {p.reps}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#a0a0a0] text-sm">No PRs logged yet. Mark sets as PR when logging workouts.</p>
        )}
      </section>
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Workout history</h2>
        {workoutLogs.length > 0 ? (
          <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
            {workoutLogs.map((w) => (
              <li key={w.id}>
                <Link href={`/workouts/${w.id}`} className="block p-3 flex justify-between text-sm hover:bg-[#2a2a2a]/50">
                  <span className="text-[#f1f1f1]">{new Date(w.logged_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
                  <span className="text-[#a0a0a0]">{w.duration_minutes ?? "—"} min · RPE {w.overall_rpe ?? "—"}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#a0a0a0] text-sm">No workouts yet.</p>
        )}
        <Link href="/workouts" className="mt-2 inline-block text-sm text-[#c8a951]">All workouts →</Link>
      </section>
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Body metrics trend</h2>
        {bodyMetrics.length > 0 ? (
          <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
            {bodyMetrics.map((m) => (
              <li key={m.recorded_at} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">{new Date(m.recorded_at).toLocaleDateString("en-GB")}</span>
                <span className="text-[#a0a0a0]">{m.weight_kg != null ? `${m.weight_kg} kg` : ""} {m.body_fat_percentage != null ? `· ${m.body_fat_percentage}%` : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#a0a0a0] text-sm">No body metrics yet. Add one on your profile.</p>
        )}
        <Link href="/profile" className="mt-2 inline-block text-sm text-[#c8a951]">Profile & add measurement →</Link>
      </section>
    </div>
  );
}
