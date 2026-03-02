"use client";

import React from "react";
import { OMEGA_MODES, type OmegaMode } from "@/spine/llm/modes/OmegaModes";

type Props = {
  value: OmegaMode | "";
  onChange: (v: OmegaMode | "") => void;
  label?: string;
};

export function OmegaModeSelect({ value, onChange, label = "Omega mode" }: Props) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OmegaMode | "")}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "white",
          fontSize: 14,
        }}
      >
        <option value="">Default (no Omega lens)</option>
        {Object.entries(OMEGA_MODES).map(([id, meta]) => (
          <option key={id} value={id}>
            {meta.label}
          </option>
        ))}
      </select>
    </label>
  );
}




































