import { useState } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OMEGA TRUST TERMINAL — VISUAL DESIGN REFERENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// This is a SELF-CONTAINED design reference artifact.
// It demonstrates the full visual system with mock data.
// Use it as the source of truth for restyling your existing components.
//
// Direction: "Precision Instrument" — the lovechild of a Bloomberg
// terminal, a CERN control room, and a classified intelligence brief.
// Dark, but with DEPTH. Not flat black — layered darkness with
// atmospheric gradients, subtle noise texture, and light that feels
// like it comes from the data itself.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── DESIGN TOKENS ──────────────────────────────────────────────────

const T = {
  // Surfaces — layered darkness, not flat
  bg0: "#08090c",        // deepest — page bg
  bg1: "#0d0f14",        // panel bg
  bg2: "#12151c",        // card bg
  bg3: "#181c26",        // elevated card / hover
  bg4: "#1e2330",        // active / selected

  // Borders — barely visible structure
  border0: "#1a1e2a",    // subtle
  border1: "#252a38",    // medium
  border2: "#333a4d",    // strong (active states)

  // Text hierarchy
  text0: "#e8eaf0",      // primary — warm white, not pure
  text1: "#a0a6b8",      // secondary
  text2: "#6b7280",      // tertiary / labels
  text3: "#3d4455",      // ghost / disabled

  // Accent palette — each has semantic meaning
  mint: "#5cffc8",       // success / verified / integrity pass
  mintDim: "#2a6b55",
  mintGlow: "rgba(92, 255, 200, 0.08)",

  amber: "#ffb347",      // warning / running / conditions
  amberDim: "#6b5a2a",
  amberGlow: "rgba(255, 179, 71, 0.08)",

  coral: "#ff6b6b",      // error / kill / halt / DNP
  coralDim: "#6b2a2a",
  coralGlow: "rgba(255, 107, 107, 0.06)",

  blue: "#5fa8ff",       // info / links / decision
  blueDim: "#2a4a6b",
  blueGlow: "rgba(95, 168, 255, 0.08)",

  violet: "#a78bfa",     // hypothesis / creative
  violetDim: "#3d2a6b",
  violetGlow: "rgba(167, 139, 250, 0.08)",

  // Typography
  fontDisplay: "'DM Serif Display', 'Playfair Display', Georgia, serif",
  fontBody: "'IBM Plex Sans', 'Söhne', -apple-system, sans-serif",
  fontMono: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",

  // Spacing
  space: (n) => n * 4,

  // Radius
  r1: 6,
  r2: 10,
  r3: 14,

  // Shadows — atmospheric, not flat
  shadow1: "0 1px 3px rgba(0,0,0,0.4), 0 0 1px rgba(0,0,0,0.3)",
  shadow2: "0 4px 16px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)",
  shadow3: "0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(0,0,0,0.4)",
  shadowGlow: (color) => `0 0 20px ${color}15, 0 0 60px ${color}08`,
};

// ─── NOISE TEXTURE (SVG data URI) ───────────────────────────────────

const noiseURL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`;

// ─── KEYFRAMES ──────────────────────────────────────────────────────

const keyframes = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes chainVerify {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes subtlePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(92, 255, 200, 0); }
  50% { box-shadow: 0 0 12px 2px rgba(92, 255, 200, 0.1); }
}
`;

// ─── MOCK DATA ──────────────────────────────────────────────────────

const MOCK_RD_STAGES = [
  { id: "problem", label: "Problem Definition", subtitle: "Bottleneck isolation, hidden variables, success criteria", icon: "◉", status: "done", protocol: "PDP-2.0", hash: "a3f2c891e4b7d6a0", fields: "8/8",
    data: {
      title: "Protein-Templated Biomineralization at Manufacturing Scale",
      bottleneck: "The mineralization front velocity cannot be decoupled from protein template organization: accelerating mineral growth disrupts scaffolding before mechanical integration occurs.",
      hidden_variables: ["Electric field gradients during assembly", "Convective flow at >10mm", "Time-dependent viscoelastic response"],
      success_criteria: "Continuous material >10cm, tensile strength >100 MPa, CV <20%, throughput >1 kg/hr",
    }},
  { id: "literature", label: "Literature Scan", subtitle: "Corpus-grounded, citation-verified", icon: "◇", status: "done", protocol: "LSP-2.0", hash: "7e1b4f23c8d9a056", fields: "7/7",
    data: {
      absence_detected: "No studies on continuous flow biomineralisation",
      key_papers: [
        { title: "Hierarchical biomineralization in natural systems", year: "2023", source_ref: "SRC-1", finding: "Protein templates direct crystal orientation with nm precision" },
        { title: "Scaling limitations in synthetic nacre", year: "2024", source_ref: "SRC-4", finding: "Defect density scales super-linearly above 5mm" },
        { title: "Block copolymer templating for inorganic composites", year: "2024", source_ref: "SRC-7", finding: "Synthetic templates achieve 60 MPa without protein instability constraints" },
      ],
    }},
  { id: "hypotheses", label: "Hypothesis Generation", subtitle: "Five methods active", icon: "▷", status: "done", protocol: "HGP-2.0", hash: "c4d8e2f1a0b73965", fields: "5/5",
    data: {
      hypotheses: [
        { id: "H1", statement: "If mineralization is performed on pre-organized synthetic templates, rate-coupling constraint is eliminated", generation_method: "constraint_flip", confidence: "high", mechanism: "Temporal decoupling: organize template first, infiltrate minerals second" },
        { id: "H2", statement: "If electric field gradients are the primary defect nucleator, active field control enables scaling", generation_method: "dimensional_shift", confidence: "medium", mechanism: "Field suppression via counter-electrode arrays during mineralization" },
        { id: "H3", statement: "If we cannot decouple timescales, what guarantees failure? Thermal protein degradation during slow mineral growth", generation_method: "inversion", confidence: "high", mechanism: "Removing degradation via thermostable protein variants or crosslinking" },
        { id: "H4", statement: "Freeze-casting + biomineralization: ice crystal templating meets protein-directed growth", generation_method: "collision", confidence: "medium", mechanism: "Ice provides macroscale architecture, proteins provide nanoscale orientation" },
        { id: "H5", statement: "No one has measured real-time mechanical stress propagation during growth — this unmeasured field may dominate", generation_method: "absence", confidence: "low", mechanism: "In-situ stress sensing reveals whether fracture initiates during growth, not after" },
      ],
    }},
  { id: "experimental", label: "Experimental Design", subtitle: "MVE protocols, kill signals", icon: "▢", status: "done", protocol: "EDP-2.0", hash: "f9a2b1c3d4e56078", fields: "6/6",
    data: {
      kill_signals: [
        { signal: "No crystal formation at 10cm after 72h", threshold: "0 crystals", provenance: "estimate" },
        { signal: "Tensile strength < 50 MPa at any scale", threshold: "50 MPa", provenance: "standard" },
        { signal: "Synthetic template cost > $100/kg at scale", threshold: "$100/kg", provenance: "estimate" },
      ],
      summary: { total_experiments: 5, shortest_path_weeks: 12, estimated_total_cost: "£45,000" },
    }},
  { id: "validation", label: "Validation & Governance", subtitle: "Gates, halt triggers, the sentence", icon: "◎", status: "done", protocol: "VGP-2.0", hash: "1b2c3d4e5f6a7890", fields: "9/9",
    data: {
      governance: {
        decision_gates: [
          { gate: "Phase 1 Gate", criteria: "Crystal at 1cm scale with >60 MPa" },
          { gate: "Phase 2 Gate", criteria: "Reproducible >100 MPa at 5cm, CV <25%" },
          { gate: "Scale Gate", criteria: ">10cm with production cost model validated" },
        ],
        halt_triggers: ["No nucleation after 4 weeks", "Budget exceed 150%", "Key researcher departure"],
      },
      timeline: {
        phase_1: { duration: "3 months", deliverable: "Proof of concept at 1cm" },
        phase_2: { duration: "6 months", deliverable: "Scale demonstration at 5cm" },
        phase_3: { duration: "3 months", deliverable: "Manufacturing pathway validation" },
      },
      one_sentence: "For £280K over 9 months, we will determine whether protein-directed mineralisation can exceed 100 MPa at centimetre scale, with three kill signals that halt the programme if it cannot.",
    }},
];

const MOCK_DEC_STAGES = [
  { id: "strategic_assessment", label: "Strategic Assessment", icon: "◣", status: "done", protocol: "SAP-1.0", hash: "e5f6a7b8c9d0e1f2", fields: "4/4",
    data: {
      governing_tension: "Scale ambition vs timeline pressure — horizontal infrastructure promises coherence but requires upfront coordination costs beyond the 12-month accountability window.",
      failure_pathway: "Fund horizontal with nominal buy-in. Programmes build parallel solutions. By month 18, three incompatible systems, £2M wasted.",
    }},
  { id: "options_analysis", label: "Options Analysis", icon: "◧", status: "done", protocol: "OAP-1.0", hash: "3a4b5c6d7e8f9012", fields: "3/3",
    data: {
      options: [
        { id: "O1", title: "Horizontal-first", summary: "Build shared infrastructure from day one. Higher upfront cost, longer to first value, but unified standards." },
        { id: "O2", title: "Vertical-first + federation", summary: "Build within Scaling Trust, open-source at month 18. Faster to first value, but federation risk." },
        { id: "O3", title: "Hybrid anchor", summary: "Horizontal with Scaling Trust as anchor customer. Compromises on both speed and independence." },
      ],
      recommended_option: { id: "O2", rationale: "De-risks under current governance constraints. Federation bet is testable." },
    }},
  { id: "risk_governance", label: "Risk & Governance", icon: "◩", status: "done", protocol: "RGP-1.0", hash: "4b5c6d7e8f901234", fields: "3/3",
    data: {
      kill_criteria: [
        { criterion: "No viable trust protocol at month 6", threshold: "Zero functional prototype" },
        { criterion: "Open-source release blocked by classification", threshold: "Any IP/classification barrier" },
      ],
    }},
  { id: "board_brief", label: "Board Brief", icon: "◨", status: "done", protocol: "BBP-1.0", hash: "5c6d7e8f90123456", fields: "5/5",
    data: {
      decision_posture: "Conditions",
      authorization_statement: "Authorize vertical trust infrastructure within Scaling Trust with contractual month-18 open-source obligation.",
      conditions: ["Key researcher retention agreement", "IP audit complete before month 3", "Quarterly federation readiness reviews"],
      prohibitions: ["No cross-programme mandates before month-18 release", "No hiring for horizontal team before Phase 1 gate"],
      the_sentence: "We recommend conditional authorization of vertical trust infrastructure within Scaling Trust at £1.2M over 18 months, with contractual open-source release and three kill criteria.",
    }},
];

const MOCK_XREF = {
  connections: [
    { type: "bottleneck_tension", icon: "⟺", label: "BOTTLENECK ↔ TENSION", color: T.amber,
      rd: "Rate-coupling between protein ordering and mineral deposition",
      dec: "Scale ambition vs timeline pressure" },
    { type: "kill_alignment", icon: "⊘", label: "KILL SIGNALS ↔ CRITERIA", color: T.coral,
      rd_values: ["No crystal at 10cm", "Tensile < 50 MPa", "Template cost > $100/kg"],
      dec_values: ["No protocol at month 6", "Open-source blocked"] },
    { type: "hypothesis_option", icon: "⇒", label: "HYPOTHESES → OPTIONS", color: T.violet,
      note: "5 hypotheses → 3 options. Strongest (H1: synthetic templates) aligns with recommended (O2: vertical-first)." },
  ],
  gaps: [
    { type: "absence_gap", icon: "△", label: "UNADDRESSED ABSENCE", color: T.amber,
      value: "R&D identified no studies on continuous flow biomineralisation — Decision engine doesn't address this gap." },
  ],
  tensions: [],
  synthesis: {
    rd: "For £280K over 9 months, we will determine whether protein-directed mineralisation can exceed 100 MPa at centimetre scale, with three kill signals that halt the programme if it cannot.",
    dec: "We recommend conditional authorization of vertical trust infrastructure within Scaling Trust at £1.2M over 18 months, with contractual open-source release and three kill criteria.",
  },
};

// ─── HYPOTHESIS METHOD STYLES ───────────────────────────────────────

const HYPO_STYLES = {
  constraint_flip: { color: T.violet, label: "CONSTRAINT FLIP", bg: "rgba(167,139,250,0.07)" },
  dimensional_shift: { color: T.blue, label: "DIMENSIONAL SHIFT", bg: "rgba(95,168,255,0.07)" },
  inversion: { color: T.coral, label: "INVERSION", bg: "rgba(255,107,107,0.07)" },
  collision: { color: T.amber, label: "COLLISION", bg: "rgba(255,179,71,0.07)" },
  absence: { color: T.mint, label: "ABSENCE DETECTOR", bg: "rgba(92,255,200,0.07)" },
};

const POSTURE_COLORS = {
  Proceed: T.mint,
  Conditions: T.amber,
  Defer: T.blue,
  DNP: T.coral,
};

// ─── COMPONENTS ─────────────────────────────────────────────────────

function Badge({ children, color, glow, large }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: large ? 11 : 9, fontWeight: 600,
      fontFamily: T.fontMono, letterSpacing: "0.06em",
      color, background: glow || `${color}11`,
      border: `1px solid ${color}33`,
      borderRadius: 4, padding: large ? "4px 10px" : "2px 7px",
    }}>{children}</span>
  );
}

function SectionLabel({ children, color = T.text2, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, fontFamily: T.fontMono,
      letterSpacing: "0.14em", color, textTransform: "uppercase",
      marginBottom: T.space(3), ...style,
    }}>{children}</div>
  );
}

function Card({ children, borderColor, glowColor, style, onClick, hoverable }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: hovered ? T.bg3 : T.bg2,
        border: `1px solid ${borderColor || T.border1}`,
        borderRadius: T.r2,
        padding: "14px 16px",
        marginBottom: T.space(2),
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        boxShadow: glowColor && hovered ? T.shadowGlow(glowColor) : T.shadow1,
        ...style,
      }}
    >{children}</div>
  );
}

function AccentBar({ color, children, style }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      paddingLeft: 14,
      marginBottom: T.space(3),
      ...style,
    }}>{children}</div>
  );
}

function HashChip({ hash, label }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: T.fontMono, fontWeight: 500,
      color: T.text3, letterSpacing: "0.02em",
      background: `${T.mint}08`, border: `1px solid ${T.mint}15`,
      borderRadius: 3, padding: "1px 6px",
    }}>{label ? `${label} ` : ""}{hash}</span>
  );
}

function ProtocolChip({ protocol }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: T.fontMono, fontWeight: 600,
      color: `${T.mint}88`, border: `1px solid ${T.mint}22`,
      borderRadius: 3, padding: "2px 6px",
    }}>{protocol}</span>
  );
}

function FieldCount({ count, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, fontFamily: T.fontMono,
      color: color || `${T.mint}99`,
    }}>{count}</span>
  );
}

// ─── STAGE CARD ─────────────────────────────────────────────────────

function StageCard({ stage, expanded, onToggle, index }) {
  const statusColor = {
    idle: T.text3, running: T.amber, retrying: T.amber, done: T.mint, error: T.coral,
  }[stage.status] || T.text3;

  const isRunning = stage.status === "running" || stage.status === "retrying";

  return (
    <div style={{
      marginBottom: T.space(2),
      borderRadius: T.r2,
      overflow: "hidden",
      border: `1px solid ${isRunning ? `${T.amber}33` : expanded ? `${T.mint}18` : T.border0}`,
      background: T.bg2,
      boxShadow: expanded ? T.shadow2 : T.shadow1,
      transition: "all 0.25s ease",
      animation: stage.status === "done" ? "fadeIn 0.3s ease" : undefined,
      animationDelay: `${index * 60}ms`,
      animationFillMode: "both",
    }}>
      {/* Header */}
      <div
        onClick={() => stage.data && onToggle()}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          cursor: stage.data ? "pointer" : "default",
          background: expanded ? T.bg3 : "transparent",
          transition: "background 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 16, color: statusColor, lineHeight: 1,
            filter: isRunning ? "drop-shadow(0 0 4px rgba(255,179,71,0.4))" : undefined,
            animation: isRunning ? "pulseGlow 1.5s ease infinite" : undefined,
          }}>{stage.icon}</span>
          <div>
            <div style={{
              fontSize: 13, fontWeight: 600, fontFamily: T.fontBody,
              color: stage.status === "idle" ? T.text3 : T.text0,
              letterSpacing: "0.01em",
            }}>{stage.label}</div>
            {stage.subtitle && (
              <div style={{
                fontSize: 10, color: T.text3, fontFamily: T.fontBody,
                marginTop: 1,
              }}>{stage.subtitle}</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {stage.status === "done" && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: T.mint,
              textShadow: `0 0 8px ${T.mint}33`,
            }}>✓</span>
          )}
          {stage.data && (
            <span style={{
              fontSize: 9, color: T.text3,
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              display: "inline-block",
            }}>▸</span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && stage.data && (
        <div style={{
          padding: "0 16px 16px",
          borderTop: `1px solid ${T.border0}`,
          paddingTop: 14,
          animation: "fadeIn 0.2s ease",
        }}>
          {/* Meta bar */}
          <div style={{
            display: "flex", gap: 8, marginBottom: 14,
            flexWrap: "wrap", alignItems: "center",
          }}>
            {stage.protocol && <ProtocolChip protocol={stage.protocol} />}
            {stage.fields && <FieldCount count={stage.fields} />}
            {stage.hash && <HashChip hash={stage.hash} />}
          </div>

          {/* Stage-specific content */}
          <StageContent stage={stage} />
        </div>
      )}
    </div>
  );
}

// ─── STAGE CONTENT RENDERERS ────────────────────────────────────────

function StageContent({ stage }) {
  const d = stage.data;
  if (!d) return null;

  if (stage.id === "problem") return <ProblemContent data={d} />;
  if (stage.id === "literature") return <LiteratureContent data={d} />;
  if (stage.id === "hypotheses") return <HypothesesContent data={d} />;
  if (stage.id === "experimental") return <ExperimentalContent data={d} />;
  if (stage.id === "validation") return <ValidationContent data={d} />;
  if (stage.id === "strategic_assessment") return <StrategicContent data={d} />;
  if (stage.id === "options_analysis") return <OptionsContent data={d} />;
  if (stage.id === "risk_governance") return <RiskContent data={d} />;
  if (stage.id === "board_brief") return <BoardBriefContent data={d} />;
  return <GenericContent data={d} />;
}

function ProblemContent({ data }) {
  return (
    <div>
      <div style={{
        fontSize: 16, fontFamily: T.fontDisplay, color: T.text0,
        lineHeight: 1.5, marginBottom: 16,
      }}>{data.title}</div>

      <AccentBar color={T.coral}>
        <SectionLabel color={T.coral}>BOTTLENECK</SectionLabel>
        <div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, fontFamily: T.fontBody }}>{data.bottleneck}</div>
      </AccentBar>

      {data.hidden_variables?.length > 0 && (
        <AccentBar color={T.amber}>
          <SectionLabel color={T.amber}>HIDDEN VARIABLES</SectionLabel>
          {data.hidden_variables.map((v, i) => (
            <div key={i} style={{
              fontSize: 13, color: T.text1, lineHeight: 1.7,
              fontFamily: T.fontBody, marginBottom: 4,
              paddingLeft: 12, position: "relative",
            }}>
              <span style={{ position: "absolute", left: 0, color: T.amber, fontSize: 8, top: 6 }}>◆</span>
              {v}
            </div>
          ))}
        </AccentBar>
      )}

      <AccentBar color={T.mint}>
        <SectionLabel color={T.mint}>SUCCESS CRITERIA</SectionLabel>
        <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontFamily: T.fontBody }}>{data.success_criteria}</div>
      </AccentBar>
    </div>
  );
}

function LiteratureContent({ data }) {
  return (
    <div>
      {data.absence_detected && (
        <div style={{
          marginBottom: 16, padding: "12px 16px",
          background: T.amberGlow, borderLeft: `3px solid ${T.amber}`,
          borderRadius: `0 ${T.r1}px ${T.r1}px 0`,
        }}>
          <SectionLabel color={T.amber} style={{ marginBottom: 6 }}>ABSENCE DETECTED</SectionLabel>
          <div style={{ fontSize: 14, color: T.amber, lineHeight: 1.7, fontFamily: T.fontBody }}>{data.absence_detected}</div>
        </div>
      )}

      {data.key_papers?.length > 0 && (
        <div>
          <SectionLabel color={T.blue}>KEY PAPERS ({data.key_papers.length})</SectionLabel>
          {data.key_papers.map((p, i) => (
            <div key={i} style={{
              marginBottom: 8, padding: "10px 14px",
              background: T.blueGlow, borderLeft: `2px solid ${T.blue}44`,
              borderRadius: `0 ${T.r1}px ${T.r1}px 0`,
              animation: "slideInLeft 0.3s ease",
              animationDelay: `${i * 80}ms`,
              animationFillMode: "both",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text0, fontFamily: T.fontBody }}>{p.title}</span>
                {p.year && <span style={{ fontSize: 11, color: T.blue, fontFamily: T.fontMono }}>{p.year}</span>}
                {p.source_ref && <HashChip hash={p.source_ref} />}
              </div>
              <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontFamily: T.fontBody }}>{p.finding}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HypothesesContent({ data }) {
  return (
    <div>
      {data.hypotheses?.map((h, i) => {
        const style = HYPO_STYLES[h.generation_method] || HYPO_STYLES.absence;
        return (
          <div key={i} style={{
            marginBottom: 10, padding: "12px 16px",
            background: style.bg,
            border: `1px solid ${style.color}22`,
            borderRadius: T.r2,
            animation: "fadeIn 0.3s ease",
            animationDelay: `${i * 100}ms`,
            animationFillMode: "both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: T.text0,
                fontFamily: T.fontMono,
              }}>{h.id}</span>
              <Badge color={style.color} glow={style.bg}>{style.label}</Badge>
              {h.confidence && (
                <Badge color={h.confidence === "high" ? T.mint : h.confidence === "medium" ? T.amber : T.text2}>
                  {h.confidence.toUpperCase()}
                </Badge>
              )}
            </div>
            <div style={{
              fontSize: 14, color: T.text0, lineHeight: 1.8,
              fontFamily: T.fontBody, marginBottom: h.mechanism ? 6 : 0,
            }}>{h.statement}</div>
            {h.mechanism && (
              <div style={{
                fontSize: 12, color: T.text2, lineHeight: 1.6,
                fontFamily: T.fontBody, fontStyle: "italic",
              }}>
                <span style={{ color: T.text3, fontWeight: 600, fontStyle: "normal" }}>Mechanism: </span>
                {h.mechanism}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ExperimentalContent({ data }) {
  return (
    <div>
      {data.kill_signals?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel color={T.coral}>KILL SIGNALS</SectionLabel>
          {data.kill_signals.map((k, i) => (
            <div key={i} style={{
              marginBottom: 6, padding: "10px 14px",
              background: T.coralGlow,
              borderLeft: `3px solid ${T.coral}`,
              borderRadius: `0 ${T.r1}px ${T.r1}px 0`,
            }}>
              <div style={{ fontSize: 13, color: T.coral, fontWeight: 600, fontFamily: T.fontBody }}>{k.signal}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: T.text2, fontFamily: T.fontMono }}>Threshold: {k.threshold}</span>
                {k.provenance && <span style={{ fontSize: 10, color: T.text3, fontFamily: T.fontMono }}>{k.provenance}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.summary && (
        <div style={{
          display: "flex", gap: 16, flexWrap: "wrap",
          padding: "10px 14px", background: T.bg3,
          borderRadius: T.r1, border: `1px solid ${T.border0}`,
        }}>
          {Object.entries(data.summary).map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em" }}>{k.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 15, color: T.blue, fontWeight: 600, fontFamily: T.fontMono, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationContent({ data }) {
  return (
    <div>
      {data.governance?.decision_gates && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel color={T.amber}>GOVERNANCE GATES</SectionLabel>
          {data.governance.decision_gates.map((g, i) => (
            <div key={i} style={{
              marginBottom: 6, padding: "8px 14px",
              background: T.amberGlow,
              borderLeft: `2px solid ${T.amber}55`,
              borderRadius: `0 ${T.r1}px ${T.r1}px 0`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text0, fontFamily: T.fontBody }}>{g.gate}</div>
              <div style={{ fontSize: 12, color: T.text1, fontFamily: T.fontBody }}>{g.criteria}</div>
            </div>
          ))}
        </div>
      )}

      {data.governance?.halt_triggers && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel color={T.coral}>HALT TRIGGERS</SectionLabel>
          {data.governance.halt_triggers.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: T.coral, marginBottom: 4, fontFamily: T.fontBody }}>
              <span style={{ color: T.coralDim, marginRight: 6 }}>⊘</span>{t}
            </div>
          ))}
        </div>
      )}

      {data.timeline && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel color={T.blue}>TIMELINE</SectionLabel>
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {Object.entries(data.timeline).map(([phase, info], i, arr) => (
              <div key={phase} style={{
                flex: 1, minWidth: 140,
                padding: "10px 14px",
                background: T.blueGlow,
                borderLeft: i === 0 ? `3px solid ${T.blue}` : `1px solid ${T.border0}`,
                borderRadius: i === 0 ? `0 0 0 0` : undefined,
                position: "relative",
              }}>
                <div style={{ fontSize: 10, color: T.blue, fontWeight: 700, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {phase.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 13, color: T.text0, marginTop: 4, fontFamily: T.fontBody }}>{info.duration}</div>
                <div style={{ fontSize: 11, color: T.text2, fontFamily: T.fontBody }}>{info.deliverable}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StrategicContent({ data }) {
  return (
    <div>
      {data.governing_tension && (
        <AccentBar color={T.amber}>
          <SectionLabel color={T.amber}>GOVERNING TENSION</SectionLabel>
          <div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, fontFamily: T.fontBody }}>{data.governing_tension}</div>
        </AccentBar>
      )}
      {data.failure_pathway && (
        <AccentBar color={T.coral}>
          <SectionLabel color={T.coral}>FAILURE PATHWAY</SectionLabel>
          <div style={{ fontSize: 14, color: T.coral, lineHeight: 1.8, fontFamily: T.fontBody, opacity: 0.9 }}>{data.failure_pathway}</div>
        </AccentBar>
      )}
    </div>
  );
}

function OptionsContent({ data }) {
  const rec = data.recommended_option;
  return (
    <div>
      {data.options?.map((o, i) => {
        const isRec = rec && (o.id === rec.id || o.id === rec);
        return (
          <div key={i} style={{
            marginBottom: 8, padding: "12px 16px",
            background: isRec ? T.mintGlow : T.bg3,
            border: `1px solid ${isRec ? `${T.mint}33` : T.border0}`,
            borderRadius: T.r2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text0, fontFamily: T.fontMono }}>{o.id}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text0, fontFamily: T.fontBody }}>{o.title}</span>
              {isRec && <Badge color={T.mint} large>RECOMMENDED</Badge>}
            </div>
            <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontFamily: T.fontBody }}>{o.summary}</div>
          </div>
        );
      })}
    </div>
  );
}

function RiskContent({ data }) {
  return (
    <div>
      {data.kill_criteria?.length > 0 && (
        <div>
          <SectionLabel color={T.coral}>KILL CRITERIA</SectionLabel>
          {data.kill_criteria.map((k, i) => (
            <div key={i} style={{
              marginBottom: 6, padding: "10px 14px",
              background: T.coralGlow,
              borderLeft: `3px solid ${T.coral}`,
              borderRadius: `0 ${T.r1}px ${T.r1}px 0`,
            }}>
              <div style={{ fontSize: 13, color: T.coral, fontWeight: 600, fontFamily: T.fontBody }}>{k.criterion}</div>
              {k.threshold && <div style={{ fontSize: 11, color: T.text2, fontFamily: T.fontMono, marginTop: 2 }}>{k.threshold}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoardBriefContent({ data }) {
  const posture = (data.decision_posture || "Conditions").replace(/\s+/g, "");
  const postureColor = POSTURE_COLORS[posture] || T.amber;

  return (
    <div>
      {data.authorization_statement && (
        <AccentBar color={T.blue}>
          <SectionLabel color={T.blue}>AUTHORIZATION</SectionLabel>
          <div style={{ fontSize: 14, color: T.text0, lineHeight: 1.8, fontFamily: T.fontBody }}>{data.authorization_statement}</div>
        </AccentBar>
      )}

      {data.conditions?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel color={T.amber}>CONDITIONS</SectionLabel>
          {data.conditions.map((c, i) => (
            <div key={i} style={{ fontSize: 13, color: T.amber, marginBottom: 4, fontFamily: T.fontBody }}>
              <span style={{ color: T.amberDim, marginRight: 6 }}>◆</span>{c}
            </div>
          ))}
        </div>
      )}

      {data.prohibitions?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel color={T.coral}>PROHIBITIONS</SectionLabel>
          {data.prohibitions.map((p, i) => (
            <div key={i} style={{ fontSize: 13, color: T.coral, marginBottom: 4, fontFamily: T.fontBody }}>
              <span style={{ color: T.coralDim, marginRight: 6 }}>⊘</span>{p}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Badge color={postureColor} large glow={`${postureColor}18`}>{posture.toUpperCase()}</Badge>
      </div>
    </div>
  );
}

function GenericContent({ data }) {
  return <pre style={{ fontSize: 12, color: T.text1, fontFamily: T.fontMono, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{JSON.stringify(data, null, 2)}</pre>;
}

// ─── THE SENTENCE ───────────────────────────────────────────────────

function TheSentence({ text, label, color, hash, time }) {
  return (
    <div style={{
      padding: "20px 24px",
      borderRadius: T.r3,
      background: `linear-gradient(170deg, ${color}08 0%, ${T.bg1} 40%, ${T.bg0} 100%)`,
      border: `1px solid ${color}25`,
      boxShadow: T.shadowGlow(color),
      animation: "subtlePulse 4s ease infinite",
    }}>
      <SectionLabel color={color} style={{ marginBottom: 14, letterSpacing: "0.18em" }}>{label}</SectionLabel>
      <div style={{
        fontSize: "clamp(15px, 3vw, 19px)",
        lineHeight: 1.9,
        color: T.text0,
        fontFamily: T.fontDisplay,
        fontStyle: "italic",
        fontWeight: 400,
      }}>{text}</div>
      {(hash || time) && (
        <div style={{
          marginTop: 14, display: "flex", gap: 12,
          fontSize: 10, color: T.text3, fontFamily: T.fontMono,
        }}>
          {hash && <span>Chain: {hash}</span>}
          {time && <span>{time}s</span>}
        </div>
      )}
    </div>
  );
}

// ─── CROSS-REFERENCE VIEW ───────────────────────────────────────────

function CrossRefSection({ xref }) {
  return (
    <div style={{ marginTop: 24 }}>
      {/* Connections */}
      {xref.connections.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel color={T.blue}>CONNECTIONS ({xref.connections.length})</SectionLabel>
          {xref.connections.map((c, i) => (
            <Card key={i} borderColor={`${c.color}33`} style={{ borderLeft: `3px solid ${c.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                <Badge color={c.color}>{c.label}</Badge>
              </div>
              {c.rd && (
                <>
                  <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>R&D ENGINE</div>
                  <div style={{ fontSize: 13, color: T.text0, lineHeight: 1.7, fontFamily: T.fontBody, marginBottom: 8 }}>{c.rd}</div>
                </>
              )}
              {c.dec && (
                <>
                  <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>DECISION ENGINE</div>
                  <div style={{ fontSize: 13, color: T.text0, lineHeight: 1.7, fontFamily: T.fontBody }}>{c.dec}</div>
                </>
              )}
              {c.rd_values && (
                <>
                  <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, marginBottom: 2 }}>R&D ({c.rd_values.length})</div>
                  {c.rd_values.map((v, j) => <div key={j} style={{ fontSize: 12, color: T.coral, marginBottom: 2, fontFamily: T.fontBody }}>{v}</div>)}
                  <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6, marginBottom: 2 }}>DECISION ({c.dec_values.length})</div>
                  {c.dec_values.map((v, j) => <div key={j} style={{ fontSize: 12, color: T.coral, marginBottom: 2, fontFamily: T.fontBody }}>{v}</div>)}
                </>
              )}
              {c.note && <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, marginTop: 6, fontStyle: "italic", fontFamily: T.fontBody }}>{c.note}</div>}
            </Card>
          ))}
        </div>
      )}

      {/* Gaps */}
      {xref.gaps.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel color={T.amber}>GAPS ({xref.gaps.length})</SectionLabel>
          {xref.gaps.map((g, i) => (
            <Card key={i} borderColor={`${T.amber}33`} style={{ borderLeft: `3px solid ${T.amber}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{g.icon}</span>
                <Badge color={T.amber}>{g.label}</Badge>
              </div>
              <div style={{ fontSize: 13, color: T.text0, lineHeight: 1.7, fontFamily: T.fontBody }}>{g.value}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SYNTHESIS: THE TWO SENTENCES ───────────────────────────────────

function SynthesisView({ synthesis }) {
  if (!synthesis) return null;
  return (
    <div style={{
      marginTop: 28,
      padding: "24px 28px",
      borderRadius: T.r3,
      background: `linear-gradient(175deg, ${T.mint}06 0%, ${T.bg1} 30%, ${T.blue}04 70%, ${T.bg0} 100%)`,
      border: `1px solid ${T.mint}18`,
      boxShadow: `${T.shadowGlow(T.mint)}, inset 0 1px 0 ${T.mint}08`,
    }}>
      <SectionLabel color={T.mint} style={{ letterSpacing: "0.2em", marginBottom: 20 }}>
        THE TWO SENTENCES
      </SectionLabel>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          R&D — THE SENTENCE THAT SURVIVES THE MEETING
        </div>
        <div style={{
          fontSize: "clamp(14px, 2.5vw, 17px)",
          lineHeight: 1.9, color: T.mint,
          fontFamily: T.fontDisplay, fontStyle: "italic",
        }}>"{synthesis.rd}"</div>
      </div>

      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${T.border1}, transparent)`, margin: "16px 0" }} />

      <div>
        <div style={{ fontSize: 9, color: T.text3, fontFamily: T.fontMono, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          DECISION — THE BOARD SENTENCE
        </div>
        <div style={{
          fontSize: "clamp(14px, 2.5vw, 17px)",
          lineHeight: 1.9, color: T.blue,
          fontFamily: T.fontDisplay, fontStyle: "italic",
        }}>"{synthesis.dec}"</div>
      </div>
    </div>
  );
}

// ─── MAIN DEMO ──────────────────────────────────────────────────────

export default function OmegaTrustTerminalDesign() {
  const [rdExpanded, setRdExpanded] = useState(4);
  const [decExpanded, setDecExpanded] = useState(3);
  const [activeTab, setActiveTab] = useState("engines");

  return (
    <>
      <style>{keyframes}</style>
      <div style={{
        minHeight: "100vh",
        background: `${T.bg0}`,
        backgroundImage: noiseURL,
        backgroundRepeat: "repeat",
        color: T.text0,
        fontFamily: T.fontBody,
        padding: "24px 20px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 28, padding: "0 4px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: T.mint,
              boxShadow: `0 0 8px ${T.mint}66, 0 0 24px ${T.mint}22`,
            }} />
            <div>
              <div style={{
                fontSize: 15, fontWeight: 700, fontFamily: T.fontBody,
                letterSpacing: "0.08em", color: T.text0,
              }}>OMEGA TRUST TERMINAL</div>
              <div style={{
                fontSize: 10, fontFamily: T.fontMono, color: T.text3,
                letterSpacing: "0.06em", marginTop: 2,
              }}>TAMPER-EVIDENT INTELLIGENCE INFRASTRUCTURE</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Badge color={T.mint} large>CHAIN VERIFIED</Badge>
            <Badge color={T.text2}>v1.1.0</Badge>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 20,
          background: T.bg1, borderRadius: T.r2,
          padding: 3, border: `1px solid ${T.border0}`,
        }}>
          {[
            { id: "engines", label: "ENGINES" },
            { id: "intelligence", label: "UNIFIED INTELLIGENCE" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "10px 16px",
                background: activeTab === tab.id ? T.bg3 : "transparent",
                border: "none", borderRadius: T.r1,
                color: activeTab === tab.id ? T.text0 : T.text2,
                fontSize: 11, fontWeight: 700, fontFamily: T.fontMono,
                letterSpacing: "0.1em", cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >{tab.label}</button>
          ))}
        </div>

        {activeTab === "engines" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}>
            {/* R&D Engine */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 14, padding: "0 4px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: T.mint, transform: "rotate(45deg)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, letterSpacing: "0.1em", color: T.text1 }}>R&D ENGINE</span>
                <span style={{ fontSize: 10, color: T.text3, fontFamily: T.fontMono }}>5 stages</span>
              </div>
              {MOCK_RD_STAGES.map((s, i) => (
                <StageCard
                  key={s.id} stage={s} index={i}
                  expanded={rdExpanded === i}
                  onToggle={() => setRdExpanded(rdExpanded === i ? null : i)}
                />
              ))}
              {/* R&D Sentence */}
              <div style={{ marginTop: 16 }}>
                <TheSentence
                  text={MOCK_RD_STAGES[4].data.one_sentence}
                  label="THE SENTENCE THAT SURVIVES THE MEETING"
                  color={T.mint}
                  hash="a3f2c891e4b7d6a0…1b2c3d4e"
                  time="142"
                />
              </div>
            </div>

            {/* Decision Engine */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 14, padding: "0 4px",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: T.blue, transform: "rotate(45deg)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, letterSpacing: "0.1em", color: T.text1 }}>DECISION ENGINE</span>
                <span style={{ fontSize: 10, color: T.text3, fontFamily: T.fontMono }}>4 stages</span>
              </div>
              {MOCK_DEC_STAGES.map((s, i) => (
                <StageCard
                  key={s.id} stage={s} index={i}
                  expanded={decExpanded === i}
                  onToggle={() => setDecExpanded(decExpanded === i ? null : i)}
                />
              ))}
              {/* Decision Sentence */}
              <div style={{ marginTop: 16 }}>
                <TheSentence
                  text={MOCK_DEC_STAGES[3].data.the_sentence}
                  label="THE BOARD SENTENCE"
                  color={T.blue}
                  hash="e5f6a7b8c9d0e1f2…5c6d7e8f"
                  time="89"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "intelligence" && (
          <div>
            <CrossRefSection xref={MOCK_XREF} />
            <SynthesisView synthesis={MOCK_XREF.synthesis} />
          </div>
        )}
      </div>
    </>
  );
}
