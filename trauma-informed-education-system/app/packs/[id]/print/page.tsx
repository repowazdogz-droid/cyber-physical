"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { getPack } from "@/lib/packs";

export default function PackPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const pack = getPack(id);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!pack) {
    return (
      <div className="card">
        <h1>Pack not found</h1>
        <p className="small">
          No pack with ID &quot;{id}&quot;. <Link href="/packs">Browse all packs</Link>.
        </p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 40, background: "white", color: "#1a1a1a" }}>
      <div style={{ marginBottom: 24, padding: 16, background: "#f6f7fb", borderRadius: 8 }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>Print Instructions:</strong> Use your browser&apos;s Print function (Cmd/Ctrl + P) and select &quot;Save as PDF&quot;.
        </p>
        <button
          onClick={handlePrint}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            background: "#2a66ff",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Print / Save PDF
        </button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span style={{ display: "inline-block", padding: "4px 10px", background: "#f1f5f9", borderRadius: 999, fontSize: 11 }}>
            {pack.audience}
          </span>
          <span style={{ display: "inline-block", padding: "4px 10px", background: "#f1f5f9", borderRadius: 999, fontSize: 11 }}>
            {pack.duration}
          </span>
        </div>
        <h1 style={{ fontSize: 32, margin: "0 0 8px", fontWeight: 700 }}>{pack.title}</h1>
        <p style={{ fontSize: 16, color: "#666", margin: 0 }}>{pack.description}</p>
      </div>

      <div>
        <h2 style={{ fontSize: 24, marginBottom: 16, fontWeight: 600 }}>Contents</h2>
        <ol style={{ paddingLeft: 24, fontSize: 16, lineHeight: 1.8 }}>
          {pack.items.map((item, idx) => (
            <li key={idx} style={{ marginBottom: 12 }}>
              <strong>{item.title}</strong>
              <br />
              <span style={{ color: "#666", fontSize: 14 }}>{origin}{item.href}</span>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e5e5e5", fontSize: 12, color: "#999" }}>
        <p style={{ margin: 0 }}>
          Trauma-Informed Education System • V1 • Evidence-informed • Safeguarding responsibilities remain with the school
        </p>
        <p style={{ margin: "8px 0 0" }}>
          Generated from: {origin}/packs/{pack.id}
        </p>
      </div>
    </div>
  );
}
