"use client";

import type { EscalationLevel } from "@/app/api/reflect/route";

const LABELS: Record<EscalationLevel, string> = {
  green: "No immediate concerns",
  amber: "Monitor / consider referral",
  red: "Immediate action / DSL",
};

const STYLES: Record<EscalationLevel, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  amber: "bg-amber-100 text-amber-800 border-amber-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

export function EscalationBadge({ level }: { level: EscalationLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${STYLES[level]}`}
      role="status"
    >
      {LABELS[level]}
    </span>
  );
}
