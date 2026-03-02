import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [membersRes, checkInsRes, paymentsRes, classesRes, alertsRes] = await Promise.all([
    supabase.from("members").select("id, membership_status, membership_start, created_at", { count: "exact" }),
    supabase.from("check_ins").select("id, member_id, checked_in_at, members(full_name)").gte("checked_in_at", today).order("checked_in_at", { ascending: false }),
    supabase.from("payments").select("id, amount, status, payment_date").gte("payment_date", startOfMonth),
    supabase.from("classes").select("id, name, day_of_week, start_time").order("day_of_week"),
    supabase.from("members").select("id, full_name, email").in("membership_status", ["active", "notice_period"]),
  ]);

  const members = membersRes.data ?? [];
  const checkIns = checkInsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const classes = classesRes.data ?? [];
  const activeMembers = alertsRes.data ?? [];

  const activeCount = members.filter((m) => m.membership_status === "active").length;
  const noticeCount = members.filter((m) => m.membership_status === "notice_period").length;
  const newThisMonth = members.filter((m) => m.created_at && m.created_at.slice(0, 7) === startOfMonth.slice(0, 7)).length;
  const revenueThisMonth = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const overdueCount = payments.filter((p) => p.status === "pending" && p.payment_date && p.payment_date < today).length;

  const dayOfWeek = new Date().getDay();
  const todaysClasses = classes.filter((c) => c.day_of_week === dayOfWeek);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <p className="text-[#a0a0a0] text-sm">Active members</p>
          <p className="text-2xl font-bold text-[#f1f1f1]">{activeCount}</p>
          <p className="text-xs text-[#a0a0a0] mt-1">{noticeCount} in notice</p>
        </div>
        <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <p className="text-[#a0a0a0] text-sm">New this month</p>
          <p className="text-2xl font-bold text-[#c8a951]">{newThisMonth}</p>
        </div>
        <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <p className="text-[#a0a0a0] text-sm">Revenue (month)</p>
          <p className="text-2xl font-bold text-[#2a9d8f]">£{revenueThisMonth.toFixed(0)}</p>
          {overdueCount > 0 && (
            <p className="text-xs text-[#e63946] mt-1">{overdueCount} overdue</p>
          )}
        </div>
        <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <p className="text-[#a0a0a0] text-sm">Check-ins today</p>
          <p className="text-2xl font-bold text-[#f1f1f1]">{checkIns.length}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <h2 className="font-semibold text-[#f1f1f1] mb-3">Today&apos;s classes</h2>
          {todaysClasses.length === 0 ? (
            <p className="text-[#a0a0a0] text-sm">No classes scheduled today.</p>
          ) : (
            <ul className="space-y-2">
              {todaysClasses.map((c) => (
                <li key={c.id} className="flex justify-between text-sm">
                  <span className="text-[#f1f1f1]">{c.name}</span>
                  <span className="text-[#a0a0a0]">{c.start_time}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/classes" className="mt-3 inline-block text-sm text-[#c8a951]">View schedule →</Link>
        </section>

        <section className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
          <h2 className="font-semibold text-[#f1f1f1] mb-3">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/members/new" className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-medium px-4 py-2 text-sm">
              Add member
            </Link>
            <Link href="/admin/payments" className="rounded-lg border border-[#c8a951]/60 text-[#c8a951] px-4 py-2 text-sm">
              Log payment
            </Link>
            <Link href="/admin/classes" className="rounded-lg border border-[#3a3a3a] text-[#f1f1f1] px-4 py-2 text-sm">
              Manage classes
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
        <h2 className="font-semibold text-[#f1f1f1] mb-3">Check-ins today</h2>
        {checkIns.length === 0 ? (
          <p className="text-[#a0a0a0] text-sm">No check-ins yet.</p>
        ) : (
          <ul className="space-y-2">
            {checkIns.slice(0, 10).map((c) => (
              <li key={c.id} className="text-sm text-[#f1f1f1]">
                {new Date(c.checked_in_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                <span className="text-[#a0a0a0]"> — {(c.members as { full_name?: string } | null)?.full_name ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/alerts" className="mt-3 inline-block text-sm text-[#c8a951]">Retention alerts →</Link>
      </section>
    </div>
  );
}
