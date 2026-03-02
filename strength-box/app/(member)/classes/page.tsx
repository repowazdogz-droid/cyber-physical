import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function MemberClassesPage() {
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

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, description, day_of_week, start_time, duration_minutes, max_capacity")
    .order("day_of_week")
    .order("start_time");

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(thisWeekStart);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const { data: myBookings } = await supabase
    .from("class_bookings")
    .select("class_id, date, status")
    .eq("member_id", member.id)
    .gte("date", dates[0])
    .lte("date", dates[6]);

  const myBookingSet = new Set((myBookings ?? []).map((b) => `${b.class_id}-${b.date}`));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Classes</h1>
      <div className="space-y-4">
        {(classes ?? []).map((c) => (
          <div key={c.id} className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-[#f1f1f1]">{c.name}</h2>
                <p className="text-[#a0a0a0] text-sm mt-1">
                  {DAYS[c.day_of_week]} · {c.start_time} · {c.duration_minutes} min
                </p>
                {c.description && <p className="text-[#a0a0a0] text-sm mt-1">{c.description}</p>}
              </div>
            </div>
            <Link
              href={`/classes/${c.id}`}
              className="mt-3 inline-block rounded-lg bg-[#c8a951]/20 text-[#c8a951] font-medium px-4 py-2 text-sm"
            >
              View & book
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
