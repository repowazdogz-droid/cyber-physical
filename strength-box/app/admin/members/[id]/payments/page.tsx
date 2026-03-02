import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LogPaymentForm } from "./log-payment-form";

export default async function MemberPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase.from("members").select("id, full_name, monthly_rate").eq("id", id).single();
  if (!member) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status, payment_date, description")
    .eq("member_id", id)
    .order("payment_date", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6">
      <Link href={`/admin/members/${id}`} className="text-[#c8a951] text-sm">← Back to member</Link>
      <h1 className="text-xl font-bold text-[#f1f1f1]">Payments — {member.full_name}</h1>
      <LogPaymentForm memberId={id} defaultAmount={String(member.monthly_rate)} />
      <section>
        <h2 className="font-semibold text-[#f1f1f1] mb-2">History</h2>
        <ul className="rounded-xl border border-[#3a3a3a] divide-y divide-[#3a3a3a]">
          {(payments ?? []).map((p) => (
            <li key={p.id} className="p-3 flex justify-between text-sm">
              <span className="text-[#f1f1f1]">£{Number(p.amount).toFixed(2)} — {p.payment_date ?? "—"} {p.description ?? ""}</span>
              <span className={p.status === "paid" ? "text-[#2a9d8f]" : "text-[#a0a0a0]"}>{p.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
