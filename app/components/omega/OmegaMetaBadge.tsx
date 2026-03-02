// app/components/omega/OmegaMetaBadge.tsx

"use client";

import React from "react";
import type { OmegaMeta } from "@/spine/llm/modes/OmegaMeta";

interface OmegaMetaBadgeProps {
  omega?: OmegaMeta;
}

/**
 * OmegaMetaBadge: Read-only display of Omega mode provenance.
 * Shows mode, audit status, and retry information.
 */
export function OmegaMetaBadge({ omega }: OmegaMetaBadgeProps) {
  if (!omega) return null;

  const { mode, audit, retry } = omega;

  return (
    <div
      style={{
        fontSize: "12px",
        color: "#6a6a6a",
        marginTop: "8px",
        padding: "6px 8px",
        backgroundColor: "#f9f9f9",
        borderRadius: "4px",
        display: "inline-block",
      }}
    >
      <span style={{ fontWeight: 500 }}>Ω {mode}</span>
      {audit && (
        <span style={{ marginLeft: "8px" }}>
          {audit.ok ? (
            "Audit: ok"
          ) : (
            `Audit: ${audit.violations.length} violation${audit.violations.length !== 1 ? "s" : ""}`
          )}
        </span>
      )}
      {retry && (
        <span style={{ marginLeft: "8px" }}>
          Retry: {retry.attempted ? (retry.repaired ? "repaired" : "failed") : "no"}
        </span>
      )}
    </div>
  );
}




































