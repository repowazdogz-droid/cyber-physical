import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminSessionsPage() {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("pt_sessions")
    .select("id, member_id, scheduled_at, duration_minutes, status, members(full_name)")
    .gte("scheduled_at", new Date().toISOString().slice(0, 10))
    .order("scheduled_at")
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#f1f1f1]">PT sessions</h1>
      <div className="rounded-xl border border-[#3a3a3a] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a2a2a] text-[#a0a0a0]">
            <tr>
              <th className="p-3 font-medium">Date & time</th>
              <th className="p-3 font-medium">Member</th>
              <th className="p-3 font-medium">Duration</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3a3a]">
            {(sessions ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-[#2a2a2a]/50">
                <td className="p-3 text-[#f1f1f1]">
                  {s.scheduled_at
                    ? new Date(s.scheduled_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })
                    : "—"}
                </td>
                <td className="p-3 text-[#f1f1f1]">
                  {(s.members as { full_name?: string } | null)?.full_name ?? "—"}
                </td>
                <td className="p-3 text-[#a0a0a0]">{s.duration_minutes} min</td>
                <td className="p-3 text-[#a0a0a0]">{s.status}</td>
                <td className="p-3">
                  <Link href={`/admin/sessions/${s.id}`} className="text-[#c8a951]">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(sessions ?? []).length === 0 && (
        <p className="text-center text-[#a0a0a0] py-8">No upcoming sessions.</p>
      )}
    </div>
  );
}
