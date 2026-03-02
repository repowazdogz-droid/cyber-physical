import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminAlertsPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, full_name, email")
    .in("membership_status", ["active", "notice_period"]);

  const memberIds = (members ?? []).map((m) => m.id);
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("member_id, checked_in_at")
    .in("member_id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"])
    .order("checked_in_at", { ascending: false });

  const lastByMember = new Map<string, string>();
  checkIns?.forEach((c) => {
    if (!lastByMember.has(c.member_id)) lastByMember.set(c.member_id, c.checked_in_at);
  });

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  const alerts: { member_id: string; full_name: string; days: number; severity: "yellow" | "red" }[] = [];
  members?.forEach((m) => {
    const last = lastByMember.get(m.id);
    if (!last) {
      alerts.push({ member_id: m.id, full_name: m.full_name, days: 999, severity: "red" });
      return;
    }
    const days = Math.floor((now - new Date(last).getTime()) / (24 * 60 * 60 * 1000));
    if (days >= 14) alerts.push({ member_id: m.id, full_name: m.full_name, days, severity: "red" });
    else if (days >= 7) alerts.push({ member_id: m.id, full_name: m.full_name, days, severity: "yellow" });
  });
  alerts.sort((a, b) => b.days - a.days);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Retention alerts</h1>
      <p className="text-[#a0a0a0] text-sm">
        Members who haven’t checked in for 7+ days (yellow) or 14+ days (red). Use these to reach out before they lapse.
      </p>
      <p className="text-[#a0a0a0] text-xs mt-1">
        Future: volume plateau, consistency patterns, and RPE vs performance insights will appear here.
      </p>
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-[#a0a0a0] py-8">No alerts. Everyone’s been in recently.</p>
        ) : (
          alerts.map((a) => (
            <Link
              key={a.member_id}
              href={`/admin/members/${a.member_id}`}
              className={`block rounded-xl border p-4 ${
                a.severity === "red"
                  ? "border-[#e63946]/50 bg-[#e63946]/10"
                  : "border-[#c8a951]/50 bg-[#c8a951]/10"
              }`}
            >
              <p className="font-medium text-[#f1f1f1]">{a.full_name}</p>
              <p className="text-sm text-[#a0a0a0] mt-1">
                {a.days === 999 ? "No check-ins recorded" : `Hasn’t trained in ${a.days} days`}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
