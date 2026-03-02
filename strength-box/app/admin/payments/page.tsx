import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: pending } = await supabase
    .from("payments")
    .select("id, member_id, amount, payment_date, description, members(full_name)")
    .eq("status", "pending")
    .order("payment_date");

  const overdue = (pending ?? []).filter((p) => p.payment_date && p.payment_date < today);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Payments</h1>
      {overdue.length > 0 && (
        <section className="rounded-xl border border-[#e63946]/50 bg-[#e63946]/10 p-4">
          <h2 className="font-semibold text-[#e63946] mb-2">Overdue ({overdue.length})</h2>
          <ul className="space-y-2">
            {overdue.map((p) => (
              <li key={p.id} className="flex justify-between text-sm">
                <span className="text-[#f1f1f1]">{(p.members as { full_name?: string } | null)?.full_name}</span>
                <span>£{Number(p.amount).toFixed(2)} — {p.payment_date}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">Pending</h2>
        <div className="rounded-xl border border-[#3a3a3a] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#2a2a2a] text-[#a0a0a0]">
              <tr>
                <th className="p-3 font-medium">Member</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3a3a3a]">
              {(pending ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-[#2a2a2a]/50">
                  <td className="p-3 text-[#f1f1f1]">{(p.members as { full_name?: string } | null)?.full_name}</td>
                  <td className="p-3 text-[#f1f1f1]">£{Number(p.amount).toFixed(2)}</td>
                  <td className="p-3 text-[#a0a0a0]">{p.payment_date ?? "—"}</td>
                  <td className="p-3">
                    <Link href={`/admin/members/${p.member_id}`} className="text-[#c8a951]">View member</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
