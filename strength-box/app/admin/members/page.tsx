import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MembersTable } from "./members-table";

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, full_name, email, membership_status, membership_tier, created_at")
    .order("full_name");

  const { data: lastCheckIns } = await supabase
    .from("check_ins")
    .select("member_id, checked_in_at")
    .order("checked_in_at", { ascending: false });

  const lastByMember = new Map<string, string>();
  lastCheckIns?.forEach((r) => {
    if (!lastByMember.has(r.member_id)) lastByMember.set(r.member_id, r.checked_in_at);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#f1f1f1]">Members</h1>
        <Link
          href="/admin/members/new"
          className="rounded-lg bg-[#c8a951] text-[#1a1a1a] font-semibold px-4 py-2 text-sm"
        >
          Add member
        </Link>
      </div>
      <MembersTable members={members ?? []} lastCheckIns={lastByMember} />
    </div>
  );
}
