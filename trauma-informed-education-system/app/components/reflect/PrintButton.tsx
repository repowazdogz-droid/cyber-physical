"use client";

import React from "react";
import type { ReflectSections } from "@/app/api/reflect/route";
import type { EscalationLevel } from "@/app/api/reflect/route";
import { REFLECT_OUTPUT_SECTION_ORDER } from "@/lib/prompts/reflectPrompt";

type Props = {
  sections: ReflectSections;
  escalationLevel: EscalationLevel;
  scenarioSummary?: string;
};

export function PrintButton({ sections, escalationLevel, scenarioSummary }: Props) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const sectionOrder = [...REFLECT_OUTPUT_SECTION_ORDER];
    const body = sectionOrder
      .filter((t) => sections[t])
      .map(
        (title) =>
          `<section style="margin-bottom: 1.5rem;"><h2 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem;">${escapeHtml(title)}</h2><div style="font-size: 0.875rem; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(sections[title])}</div></section>`
      )
      .join("");
    const escalationLabel =
      escalationLevel === "red"
        ? "Immediate action / DSL"
        : escalationLevel === "amber"
          ? "Monitor / consider referral"
          : "No immediate concerns";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reflect — Supervision notes</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 1in; color: #111; max-width: 65ch; margin: 0 auto; }
            .meta { font-size: 0.75rem; color: #6b7280; margin-bottom: 1rem; }
            .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; margin-bottom: 1rem; }
            .badge-green { background: #d1fae5; color: #065f46; }
            .badge-amber { background: #fef3c7; color: #92400e; }
            .badge-red { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="meta">Reflect for Schools — Dual-lens analysis. Generated ${new Date().toLocaleString()}.</div>
          ${scenarioSummary ? `<div class="meta">${escapeHtml(scenarioSummary)}</div>` : ""}
          <div class="badge badge-${escalationLevel}">${escapeHtml(escalationLabel)}</div>
          ${body}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="btn btnSecondary"
    >
      Print / export
    </button>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
