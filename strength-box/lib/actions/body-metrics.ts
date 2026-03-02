"use server";

import { createClient } from "@/lib/supabase/server";

type AddBodyMetricParams = {
  memberId?: string;
  weightKg?: number | null;
  bodyFatPercentage?: number | null;
  notes?: string | null;
  recordedAt?: string;
};

/** Member: omit memberId to use current user's member. Admin: pass memberId. */
export async function addBodyMetric(params: AddBodyMetricParams): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let memberId: string;

  if (params.memberId) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return { error: "Admin only when specifying member" };
    memberId = params.memberId;
  } else {
    const { data: member } = await supabase.from("members").select("id").eq("user_id", user.id).single();
    if (!member) return { error: "Member record not found" };
    memberId = member.id;
  }

  const recordedAt = params.recordedAt
    ? new Date(params.recordedAt).toISOString()
    : new Date().toISOString();

  const { error } = await supabase.from("body_metrics").insert({
    member_id: memberId,
    weight_kg: params.weightKg ?? null,
    body_fat_percentage: params.bodyFatPercentage ?? null,
    notes: params.notes || null,
    recorded_at: recordedAt,
  });

  if (error) return { error: error.message };
  return {};
}
