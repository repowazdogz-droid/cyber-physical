"use server";

import { createClient } from "@/lib/supabase/server";

const FRIEND_FRIDAY_PRICE_GBP = 1;

/** Admin only. Record a guest pass. Enforces 1 free monthly per member per calendar month. */
export async function recordGuestPass(
  memberId: string,
  type: "monthly_free" | "friend_friday",
  guestName?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Admin only" };

  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (type === "monthly_free") {
    const { data: existing } = await supabase
      .from("guest_passes")
      .select("id")
      .eq("member_id", memberId)
      .eq("type", "monthly_free")
      .eq("month_year", monthYear)
      .limit(1);
    if (existing && existing.length > 0) {
      return { error: "This member has already used their free pass for this month." };
    }
  }

  const { error } = await supabase.from("guest_passes").insert({
    member_id: memberId,
    type,
    guest_name: guestName || null,
    month_year: type === "monthly_free" ? monthYear : null,
  });

  if (error) return { error: error.message };

  if (type === "friend_friday") {
    await supabase.from("payments").insert({
      member_id: memberId,
      amount: FRIEND_FRIDAY_PRICE_GBP,
      currency: "gbp",
      status: "paid",
      payment_date: now.toISOString().slice(0, 10),
      description: "Friend Friday guest pass",
    });
  }

  return {};
}
