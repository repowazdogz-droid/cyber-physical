import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MemberWorkoutsPage() {
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

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("id, logged_at, duration_minutes, overall_rpe, notes")
    .eq("member_id", member.id)
    .order("logged_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#f1f1f1]">Workouts</h1>
        <Link href="/workouts/log" className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 text-sm">
          Log workout
        </Link>
      </div>
      <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
        {(logs ?? []).map((w) => (
          <li key={w.id}>
            <Link href={`/workouts/${w.id}`} className="block p-4 hover:bg-[#2a2a2a]/50">
              <p className="font-medium text-[#f1f1f1]">
                {new Date(w.logged_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
              </p>
              <p className="text-sm text-[#a0a0a0] mt-1">
                {w.duration_minutes ?? "—"} min · RPE {w.overall_rpe ?? "—"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {(!logs || logs.length === 0) && (
        <p className="text-center text-[#a0a0a0] py-8">No workouts yet. Log your first one.</p>
      )}
    </div>
  );
}
