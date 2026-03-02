import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MemberDetail } from "./member-detail";
import { RecordGuestPassForm } from "./record-guest-pass-form";
import { BodyMetricForm } from "@/components/body-metric-form";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase.from("members").select("*").eq("id", id).single();
  if (!member) notFound();

  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const [checkInsRes, paymentsRes, programmesRes, workoutLogsRes, guestPassesRes, bodyMetricsRes] = await Promise.all([
    supabase.from("check_ins").select("id, member_id, checked_in_at, checked_out_at, type").eq("member_id", id).order("checked_in_at", { ascending: false }).limit(20),
    supabase.from("payments").select("id, amount, status, payment_date, description").eq("member_id", id).order("payment_date", { ascending: false }).limit(20),
    supabase.from("programmes").select("id, name, goal, active").eq("member_id", id),
    supabase.from("workout_logs").select("id, logged_at, duration_minutes, overall_rpe").eq("member_id", id).order("logged_at", { ascending: false }).limit(10),
    supabase.from("guest_passes").select("id, guest_name, used_at, type, month_year").eq("member_id", id).order("used_at", { ascending: false }).limit(20),
    supabase.from("body_metrics").select("id, recorded_at, weight_kg, body_fat_percentage, notes").eq("member_id", id).order("recorded_at", { ascending: false }).limit(20),
  ]);

  const guestPasses = guestPassesRes.data ?? [];
  const usedFreeThisMonth = guestPasses.some(
    (g) => g.type === "monthly_free" && g.month_year === monthYear
  );

  const bodyMetrics = bodyMetricsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/members" className="text-[#c8a951] text-sm">← Members</Link>
      </div>
      <MemberDetail
        member={member}
        checkIns={checkInsRes.data ?? []}
        payments={paymentsRes.data ?? []}
        programmes={programmesRes.data ?? []}
        workoutLogs={workoutLogsRes.data ?? []}
        guestPasses={guestPasses}
        guestPassForm={
          <RecordGuestPassForm
            memberId={id}
            usedFreeThisMonth={usedFreeThisMonth}
            currentMonthLabel={currentMonthLabel}
          />
        }
      />
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Body metrics</h2>
        <BodyMetricForm memberId={id} />
        {bodyMetrics.length > 0 ? (
          <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a] mt-4">
            {bodyMetrics.map((m) => (
              <li key={m.id} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">{new Date(m.recorded_at).toLocaleDateString("en-GB")}</span>
                <span className="text-[#a0a0a0]">
                  {m.weight_kg != null ? `${m.weight_kg} kg` : ""}
                  {m.weight_kg != null && m.body_fat_percentage != null ? " · " : ""}
                  {m.body_fat_percentage != null ? `${m.body_fat_percentage}%` : ""}
                  {m.notes ? ` · ${m.notes}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#a0a0a0] text-sm mt-4">No body metrics recorded.</p>
        )}
      </section>
    </div>
  );
}
