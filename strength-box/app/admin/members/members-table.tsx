"use client";

import { useState } from "react";
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
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-[#3a3a3a] text-[#a0a0a0]"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function MembersTable({
  members,
  lastCheckIns,
}: {
  members: (Pick<Member, "id" | "full_name" | "email" | "membership_status" | "membership_tier" | "created_at">)[];
  lastCheckIns: Map<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = members.filter((m) => {
    const matchSearch =
      !search ||
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.membership_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] px-4 py-2 text-[#f1f1f1] placeholder-[#666] focus:border-[#c8a951] focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] px-4 py-2 text-[#f1f1f1] focus:border-[#c8a951] focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="notice_period">Notice period</option>
          <option value="cancelled">Cancelled</option>
          <option value="frozen">Frozen</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="rounded-xl border border-[#3a3a3a] overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#2a2a2a] text-[#a0a0a0]">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium hidden sm:table-cell">Email</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Last check-in</th>
              <th className="p-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3a3a]">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-[#2a2a2a]/50">
                <td className="p-3 font-medium text-[#f1f1f1]">{m.full_name}</td>
                <td className="p-3 text-[#a0a0a0] hidden sm:table-cell">{m.email}</td>
                <td className="p-3">
                  <StatusBadge status={m.membership_status} />
                </td>
                <td className="p-3 text-[#a0a0a0]">
                  {lastCheckIns.get(m.id)
                    ? new Date(lastCheckIns.get(m.id)!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : "—"}
                </td>
                <td className="p-3">
                  <Link href={`/admin/members/${m.id}`} className="text-[#c8a951] font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-[#a0a0a0] py-8">No members match your filters.</p>
      )}
    </div>
  );
}
