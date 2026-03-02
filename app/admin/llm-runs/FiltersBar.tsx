// app/admin/llm-runs/FiltersBar.tsx

"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OmegaMode } from "@/spine/llm/modes/OmegaModes";

export function FiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams?.get("mode") || "";
  const audit = searchParams?.get("audit") || "";
  const retry = searchParams?.get("retry") || "";
  const q = searchParams?.get("q") || "";
  const limit = searchParams?.get("limit") || "50";

  const updateFilter = (key: string, value: string) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/llm-runs?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("/admin/llm-runs");
  };

  return (
    <div className="card" style={{ marginBottom: "var(--s-5)" }}>
      <div style={{ display: "grid", gap: "var(--s-4)", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <div>
          <label style={{ display: "block", fontSize: "var(--text-sm)", marginBottom: "var(--s-2)", color: "var(--muted)" }}>
            Mode
          </label>
          <select
            value={mode}
            onChange={(e) => updateFilter("mode", e.target.value)}
            style={{
              width: "100%",
              padding: "var(--s-2)",
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-1)",
            }}
          >
            <option value="">All</option>
            <option value="v37">v37</option>
            <option value="V">V</option>
            <option value="B">B</option>
            <option value="R">R</option>
            <option value="G">G</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "var(--text-sm)", marginBottom: "var(--s-2)", color: "var(--muted)" }}>
            Audit
          </label>
          <select
            value={audit}
            onChange={(e) => updateFilter("audit", e.target.value)}
            style={{
              width: "100%",
              padding: "var(--s-2)",
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-1)",
            }}
          >
            <option value="">All</option>
            <option value="ok">Audit OK</option>
            <option value="fail">Audit Failed</option>
            <option value="none">No Audit</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "var(--text-sm)", marginBottom: "var(--s-2)", color: "var(--muted)" }}>
            Retry
          </label>
          <select
            value={retry}
            onChange={(e) => updateFilter("retry", e.target.value)}
            style={{
              width: "100%",
              padding: "var(--s-2)",
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-1)",
            }}
          >
            <option value="">All</option>
            <option value="1">Retried</option>
            <option value="0">Not Retried</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "var(--text-sm)", marginBottom: "var(--s-2)", color: "var(--muted)" }}>
            Limit
          </label>
          <select
            value={limit}
            onChange={(e) => updateFilter("limit", e.target.value)}
            style={{
              width: "100%",
              padding: "var(--s-2)",
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-1)",
            }}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "var(--text-sm)", marginBottom: "var(--s-2)", color: "var(--muted)" }}>
            Search
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => updateFilter("q", e.target.value)}
            placeholder="Search prompt/output..."
            style={{
              width: "100%",
              padding: "var(--s-2)",
              fontSize: "var(--text-sm)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-1)",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            type="button"
            onClick={resetFilters}
            className="btn"
            style={{
              width: "100%",
              padding: "var(--s-2)",
              fontSize: "var(--text-sm)",
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

