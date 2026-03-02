import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditMemberForm } from "./edit-member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase.from("members").select("*").eq("id", id).single();
  if (!member) notFound();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold text-[#f1f1f1]">Edit member</h1>
      <EditMemberForm member={member} />
    </div>
  );
}
