// app/admin/llm-runs/CopyButton.tsx

"use client";

import React from "react";

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // no-op
        }
      }}
    >
      {label}
    </button>
  );
}




































