"use client";

import Link from "next/link";
import type { Member } from "@/types/database";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-[#2a9d8f]/20 text-[#2a9d8f]",
    notice_period: "bg-[#c8a951]/20 text-[#c8a951]",
    cancelled: "bg-[#e63946]/20 text-[#e63946]",
    frozen: "bg-[#666]/20 text-[#a0a0a0]",
    pending: "bg-[#666]/20 text-[#a0a0a0]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function MemberDetail({
  member,
  checkIns,
  payments,
  programmes,
  workoutLogs,
  guestPasses,
  guestPassForm,
}: {
  member: Member;
  checkIns: { id: string; checked_in_at: string; type?: string }[];
  payments: { id: string; amount: number; status: string; payment_date: string | null; description: string | null }[];
  programmes: { id: string; name: string; goal: string | null; active: boolean }[];
  workoutLogs: { id: string; logged_at: string; duration_minutes: number | null; overall_rpe: number | null }[];
  guestPasses: { id: string; guest_name: string | null; used_at: string; type: string; month_year: string | null }[];
  guestPassForm: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#f1f1f1]">{member.full_name}</h1>
            <p className="text-[#a0a0a0]">{member.email}</p>
            {member.phone && <p className="text-[#a0a0a0] text-sm mt-1">{member.phone}</p>}
            <div className="mt-2 flex gap-2">
              <StatusBadge status={member.membership_status} />
              <span className="rounded-full bg-[#3a3a3a] px-2 py-0.5 text-xs text-[#a0a0a0]">
                {member.membership_tier}
              </span>
            </div>
          </div>
          <Link
            href={`/admin/members/${member.id}/edit`}
            className="rounded-lg border border-[#c8a951]/60 text-[#c8a951] px-3 py-1.5 text-sm"
          >
            Edit
          </Link>
        </div>
        {member.emergency_contact_name && (
          <p className="mt-3 text-sm text-[#a0a0a0]">
            Emergency: {member.emergency_contact_name} {member.emergency_contact_phone}
          </p>
        )}
        {member.notes && (
          <p className="mt-2 text-sm text-[#a0a0a0] border-t border-[#3a3a3a] pt-3">{member.notes}</p>
        )}
        <p className="mt-2 text-sm text-[#c8a951]">£{Number(member.monthly_rate).toFixed(2)}/month</p>
      </div>

      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Recent check-ins</h2>
        <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
          {checkIns.length === 0 ? (
            <li className="p-3 text-[#a0a0a0] text-sm">No check-ins yet.</li>
          ) : (
            checkIns.map((c) => (
              <li key={c.id} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">
                  {new Date(c.checked_in_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="text-[#a0a0a0]">{c.type ?? "gym"}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Payments</h2>
        <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
          {payments.length === 0 ? (
            <li className="p-3 text-[#a0a0a0] text-sm">No payments yet.</li>
          ) : (
            payments.map((p) => (
              <li key={p.id} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">£{Number(p.amount).toFixed(2)} — {p.payment_date ?? "—"}</span>
                <span className={p.status === "paid" ? "text-[#2a9d8f]" : p.status === "pending" ? "text-[#c8a951]" : "text-[#e63946]"}>
                  {p.status}
                </span>
              </li>
            ))
          )}
        </ul>
        <Link href={`/admin/members/${member.id}/payments`} className="mt-2 inline-block text-sm text-[#c8a951]">
          Log payment
        </Link>
      </section>

      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Programmes</h2>
        {programmes.length === 0 ? (
          <p className="text-[#a0a0a0] text-sm">No programmes assigned.</p>
        ) : (
          <ul className="space-y-2">
            {programmes.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/programmes/${p.id}`} className="text-[#c8a951]">
                  {p.name} {p.active ? "(active)" : ""}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Guest passes</h2>
        <p className="text-[#a0a0a0] text-sm mb-2">1 free monthly per member; Friend Friday £1.</p>
        {guestPassForm}
        <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a] mt-4">
          {guestPasses.length === 0 ? (
            <li className="p-3 text-[#a0a0a0] text-sm">None used.</li>
          ) : (
            guestPasses.map((g) => (
              <li key={g.id} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">{g.guest_name ?? "—"} · {g.type === "friend_friday" ? "Friend Friday (£1)" : "Monthly free"}</span>
                <span className="text-[#a0a0a0]">{g.month_year ?? new Date(g.used_at).toISOString().slice(0, 7)}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Recent workouts</h2>
        <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
          {workoutLogs.length === 0 ? (
            <li className="p-3 text-[#a0a0a0] text-sm">No workouts logged.</li>
          ) : (
            workoutLogs.map((w) => (
              <li key={w.id} className="p-3 flex justify-between text-sm">
                <span className="text-[#f1f1f1]">
                  {new Date(w.logged_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                </span>
                <span className="text-[#a0a0a0]">{w.duration_minutes ?? "—"} min · RPE {w.overall_rpe ?? "—"}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
