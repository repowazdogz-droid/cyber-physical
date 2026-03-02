import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PayNowButton } from "@/components/pay-now-button";
import { BodyMetricForm } from "@/components/body-metric-form";

export default async function MemberProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return (
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-6">
        <p className="text-[#a0a0a0]">Membership pending. Contact the gym.</p>
      </div>
    );
  }

  const [metricsRes, guestPassesRes] = await Promise.all([
    supabase.from("body_metrics").select("id, recorded_at, weight_kg, body_fat_percentage, notes").eq("member_id", member.id).order("recorded_at", { ascending: false }).limit(5),
    supabase.from("guest_passes").select("guest_name, used_at, type, month_year").eq("member_id", member.id).order("used_at", { ascending: false }).limit(10),
  ]);
  const metrics = metricsRes.data ?? [];
  const guestPasses = guestPassesRes.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Profile</h1>
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4 space-y-2">
        <p className="font-medium text-[#f1f1f1]">{member.full_name}</p>
        <p className="text-[#a0a0a0] text-sm">{member.email}</p>
        {member.phone && <p className="text-[#a0a0a0] text-sm">{member.phone}</p>}
        <p className="text-sm">
          <span className="text-[#a0a0a0]">Membership: </span>
          <span className="text-[#c8a951]">{member.membership_status}</span> · {member.membership_tier}
        </p>
        <div className="mt-3">
          <PayNowButton />
        </div>
      </div>
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Body metrics</h2>
        <BodyMetricForm />
        {metrics && metrics.length > 0 ? (
          <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
            {metrics.map((m) => (
              <li key={m.id} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">{new Date(m.recorded_at).toLocaleDateString("en-GB")}</span>
                <span className="text-[#a0a0a0]">{m.weight_kg != null ? `${m.weight_kg} kg` : ""} {m.body_fat_percentage != null ? `· ${m.body_fat_percentage}%` : ""}{m.notes ? ` · ${m.notes}` : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[#a0a0a0] text-sm">No metrics recorded.</p>
        )}
        <Link href="/progress" className="mt-2 inline-block text-sm text-[#c8a951]">Progress & charts →</Link>
      </section>
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Guest passes</h2>
        <p className="text-[#a0a0a0] text-sm mb-2">1 free monthly pass per member; Friend Friday £1 passes. Ask staff to record a pass.</p>
        {guestPasses.length === 0 ? (
          <p className="text-[#a0a0a0] text-sm">None used yet.</p>
        ) : (
          <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
            {guestPasses.map((g, i) => (
              <li key={i} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">{g.guest_name ?? "—"} · {g.type === "friend_friday" ? "Friend Friday (£1)" : "Monthly free"}</span>
                <span className="text-[#a0a0a0]">{g.month_year ?? new Date(g.used_at).toISOString().slice(0, 7)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
