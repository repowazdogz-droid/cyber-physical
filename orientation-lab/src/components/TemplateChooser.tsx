import { TEMPLATES } from "../utils/templates";
import type { Template } from "../utils/templates";

export function TemplateChooser({
  onChoose,
  onClose,
}: {
  onChoose: (t: Template) => void;
  onClose: () => void;
}) {
  return (
    <div style={wrap}>
      <div style={headRow}>
        <div>
          <div style={kicker}>New session</div>
          <div style={title}>Choose a starting template</div>
          <div style={sub}>
            Pick the closest starting shape. You can delete anything you don't need.
          </div>
        </div>
        <button style={btnGhost} onClick={onClose}>
          Close
        </button>
      </div>

      <div style={grid}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            style={card}
            onClick={() => onChoose(t)}
            title={`Start with: ${t.name}`}
          >
            <div style={cardTop}>
              <div style={cardTitle}>{t.name}</div>
              <div style={pill}>{t.id}</div>
            </div>
            <div style={cardDesc}>{t.description}</div>
            <div style={cardCta}>Start</div>
          </button>
        ))}
      </div>

      <div style={fineprint}>
        This tool does not provide answers. It helps you capture models, assumptions, disagreements,
        unknowns, and the type of judgment required.
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 14,
  padding: 14,
  background: "#fff",
};

const headRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: 12,
};

const kicker: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.08,
  color: "#666",
  textTransform: "uppercase",
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginTop: 4,
  marginBottom: 4,
};

const sub: React.CSSProperties = {
  fontSize: 13,
  color: "#555",
  maxWidth: 760,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 10,
};

const card: React.CSSProperties = {
  textAlign: "left",
  border: "1px solid #e6e6e6",
  background: "#fff",
  borderRadius: 14,
  padding: 12,
  cursor: "pointer",
};

const cardTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  marginBottom: 8,
};

const cardTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 14,
};

const pill: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  color: "#444",
};

const cardDesc: React.CSSProperties = {
  fontSize: 13,
  color: "#555",
  lineHeight: 1.35,
  minHeight: 44,
};

const cardCta: React.CSSProperties = {
  marginTop: 10,
  fontSize: 12,
  fontWeight: 900,
  color: "#111",
  opacity: 0.85,
};

const fineprint: React.CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: "#777",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e6e6e6",
  background: "#fff",
  color: "#111",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
};

