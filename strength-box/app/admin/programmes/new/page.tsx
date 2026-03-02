import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NewProgrammeForm } from "./new-programme-form";

export default async function NewProgrammePage() {
  const supabase = await createClient();
  const { data: members } = await supabase.from("members").select("id, full_name").order("full_name");
  return (
    <div className="max-w-xl space-y-4">
      <Link href="/admin/programmes" className="text-[#c8a951] text-sm">← Programmes</Link>
      <h1 className="text-xl font-bold text-[#f1f1f1]">New programme</h1>
      <NewProgrammeForm members={members ?? []} />
    </div>
  );
}
