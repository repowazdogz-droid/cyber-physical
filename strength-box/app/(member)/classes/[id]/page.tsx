import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ClassBookingSection } from "./class-booking-section";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function MemberClassDetailPage({
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

  const { data: classRow } = await supabase
    .from("classes")
    .select("id, name, description, day_of_week, start_time, duration_minutes, max_capacity")
    .eq("id", id)
    .single();
  if (!classRow) notFound();

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const dates: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(thisWeekStart);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const { data: bookings } = await supabase
    .from("class_bookings")
    .select("date, status, member_id")
    .eq("class_id", id)
    .in("date", dates);

  const countByDate = new Map<string, number>();
  const myBookings: string[] = [];
  bookings?.forEach((b) => {
    countByDate.set(b.date, (countByDate.get(b.date) ?? 0) + 1);
    if (b.member_id === member.id && b.status === "booked") myBookings.push(b.date);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">{classRow.name}</h1>
      <p className="text-[#a0a0a0] text-sm">
        {DAYS[classRow.day_of_week]} · {classRow.start_time} · {classRow.duration_minutes} min · Max {classRow.max_capacity}
      </p>
      {classRow.description && <p className="text-[#a0a0a0] text-sm">{classRow.description}</p>}
      <ClassBookingSection
        classId={classRow.id}
        memberId={member.id}
        maxCapacity={classRow.max_capacity}
        dates={dates}
        countByDate={Object.fromEntries(countByDate)}
        myBookings={myBookings}
      />
    </div>
  );
}
