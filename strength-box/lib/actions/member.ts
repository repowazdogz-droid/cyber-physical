"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureMemberLinked() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data: existing } = await supabase.from("members").select("id").eq("user_id", user.id).single();
  if (existing) return existing.id;
  const { data: updated } = await supabase
    .from("members")
    .update({ user_id: user.id })
    .eq("email", user.email)
    .select("id")
    .single();
  return updated?.id ?? null;
}

export async function checkIn(memberId: string, type: "gym" | "class" | "pt_session" | "guest" = "gym") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: member } = await supabase.from("members").select("id").eq("id", memberId).eq("user_id", user.id).single();
  if (!member) return { error: "Member not found" };
  const { error } = await supabase.from("check_ins").insert({ member_id: memberId, type });
  return error ? { error: error.message } : {};
}
