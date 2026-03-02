"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ClassBookingSection({
  classId,
  memberId,
  maxCapacity,
  dates,
  countByDate,
  myBookings,
}: {
  classId: string;
  memberId: string;
  maxCapacity: number;
  dates: string[];
  countByDate: Record<string, number>;
  myBookings: string[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggle(date: string) {
    const isBooked = myBookings.includes(date);
    setLoading(date);
    if (isBooked) {
      await supabase
        .from("class_bookings")
        .delete()
        .eq("class_id", classId)
        .eq("member_id", memberId)
        .eq("date", date);
    } else {
      const count = countByDate[date] ?? 0;
      if (count >= maxCapacity) return;
      await supabase.from("class_bookings").insert({
        class_id: classId,
        member_id: memberId,
        date,
        status: "booked",
      });
    }
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] p-4">
      <h2 className="font-semibold text-[#f1f1f1] mb-3">Book a session</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {dates.map((date) => {
          const count = countByDate[date] ?? 0;
          const isBooked = myBookings.includes(date);
          const full = count >= maxCapacity && !isBooked;
          const d = new Date(date);
          return (
            <button
              key={date}
              type="button"
              disabled={full || loading === date}
              onClick={() => toggle(date)}
              className={`touch-target rounded-lg border px-3 py-3 text-sm ${
                isBooked
                  ? "bg-[#c8a951]/20 border-[#c8a951] text-[#c8a951]"
                  : full
                    ? "border-[#3a3a3a] text-[#666] cursor-not-allowed"
                    : "border-[#3a3a3a] text-[#f1f1f1] hover:border-[#c8a951]"
              }`}
            >
              <span className="block font-medium">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
              <span className="block text-[#a0a0a0]">{d.getDate()} {d.toLocaleDateString("en-GB", { month: "short" })}</span>
              <span className="block text-xs mt-1">{count}/{maxCapacity}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
