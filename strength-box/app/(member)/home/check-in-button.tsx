"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkIn } from "@/lib/actions/member";

export function CheckInButton({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    await checkIn(memberId, "gym");
    setLoading(false);
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="touch-target rounded-lg bg-[#2a9d8f] text-white font-semibold px-4 py-2 text-sm disabled:opacity-60"
    >
      {loading ? "…" : "Check in"}
    </button>
  );
}
