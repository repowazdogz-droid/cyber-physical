import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogWorkoutForm } from "./log-workout-form";

export default async function LogWorkoutPage() {
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
    .select("id, name")
    .eq("member_id", member.id)
    .eq("active", true)
    .limit(1)
    .single();

  const { data: programmeDays } = programme
    ? await supabase
        .from("programme_days")
        .select("id, day_number, name")
        .eq("programme_id", programme.id)
        .order("day_number")
    : { data: [] };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Log workout</h1>
      <LogWorkoutForm
        memberId={member.id}
        programmeDays={programmeDays ?? []}
        programmeName={programme?.name}
      />
    </div>
  );
}
