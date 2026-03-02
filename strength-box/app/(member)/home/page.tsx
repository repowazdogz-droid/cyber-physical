import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ensureMemberLinked } from "@/lib/actions/member";
import { CheckInButton } from "./check-in-button";

export default async function MemberHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureMemberLinked();
  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return (
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-6 text-center">
        <h1 className="text-xl font-bold text-[#f1f1f1]">Welcome</h1>
        <p className="text-[#a0a0a0] mt-2">
          Your membership is being set up. Please contact the gym to get access.
        </p>
      </div>
    );
  }

  const dayOfWeek = new Date().getDay();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, start_time")
    .eq("day_of_week", dayOfWeek)
    .order("start_time");

  const { data: programme } = await supabase
    .from("programmes")
    .select("id, name")
    .eq("member_id", member.id)
    .eq("active", true)
    .limit(1)
    .single();

  const { data: recentWorkouts } = await supabase
    .from("workout_logs")
    .select("id, logged_at, duration_minutes")
    .eq("member_id", member.id)
    .order("logged_at", { ascending: false })
    .limit(3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#f1f1f1]">Hi, {member.full_name.split(" ")[0]}</h1>
        <CheckInButton memberId={member.id} />
      </div>

      {classes && classes.length > 0 && (
        <section className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <h2 className="font-semibold text-[#f1f1f1] mb-3">Today&apos;s classes</h2>
          <ul className="space-y-2">
            {classes.map((c) => (
              <li key={c.id}>
                <Link href={`/classes/${c.id}`} className="flex justify-between text-[#f1f1f1]">
                  <span>{c.name}</span>
                  <span className="text-[#c8a951]">{c.start_time}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/classes" className="mt-3 inline-block text-sm text-[#c8a951]">View full schedule →</Link>
        </section>
      )}

      {programme && (
        <section className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <h2 className="font-semibold text-[#f1f1f1] mb-2">Current programme</h2>
          <Link href="/programme" className="text-[#c8a951] font-medium">{programme.name}</Link>
        </section>
      )}

      <section className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
        <h2 className="font-semibold text-[#f1f1f1] mb-3">Recent activity</h2>
        {recentWorkouts && recentWorkouts.length > 0 ? (
          <ul className="space-y-2">
            {recentWorkouts.map((w) => (
              <Link key={w.id} href={`/workouts/${w.id}`} className="block text-sm text-[#f1f1f1]">
                {new Date(w.logged_at).toLocaleDateString("en-GB", { dateStyle: "medium" })} — {w.duration_minutes ?? "—"} min
              </Link>
            ))}
          </ul>
        ) : (
          <p className="text-[#a0a0a0] text-sm">No workouts logged yet.</p>
        )}
        <Link href="/workouts/log" className="mt-3 inline-block rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 text-sm">
          Log workout
        </Link>
      </section>
    </div>
  );
}
