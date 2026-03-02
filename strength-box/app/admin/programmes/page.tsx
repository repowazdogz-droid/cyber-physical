import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminProgrammesPage() {
  const supabase = await createClient();
  const { data: programmes } = await supabase
    .from("programmes")
    .select("id, name, goal, active, member_id, members(full_name)")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#f1f1f1]">Programmes</h1>
        <Link href="/admin/programmes/new" className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 text-sm">
          New programme
        </Link>
      </div>
      <div className="rounded-xl border border-[#3a3a3a] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a2a2a] text-[#a0a0a0]">
            <tr>
              <th className="p-3 font-medium">Programme</th>
              <th className="p-3 font-medium">Member</th>
              <th className="p-3 font-medium">Goal</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3a3a]">
            {(programmes ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-[#2a2a2a]/50">
                <td className="p-3 font-medium text-[#f1f1f1]">{p.name}</td>
                <td className="p-3 text-[#a0a0a0]">{(p.members as { full_name?: string } | null)?.full_name ?? "—"}</td>
                <td className="p-3 text-[#a0a0a0]">{p.goal ?? "—"}</td>
                <td className="p-3 text-[#a0a0a0]">{p.active ? "Yes" : "No"}</td>
                <td className="p-3">
                  <Link href={`/admin/programmes/${p.id}`} className="text-[#c8a951]">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
