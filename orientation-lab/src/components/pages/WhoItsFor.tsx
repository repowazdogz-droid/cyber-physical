import { Card, Chip } from "../ui";

type Example = {
  id: string;
  title: string;
  who: string[];
  why: string;
  provides: string[];
};

const EXAMPLES: Example[] = [
  {
    id: "irreversible",
    title: "Irreversible decisions under uncertainty",
    who: ["Boards", "Crisis leaders", "Infrastructure owners", "Executives with one-way doors"],
    why: "When the cost of being wrong is permanent, orientation matters more than speed.",
    provides: [
      "Competing models made explicit",
      "Clear separation of facts vs judgment",
      "Ownership that can be defended later",
    ],
  },
  {
    id: "governance",
    title: "Governance around powerful systems",
    who: ["AI governance teams", "Risk committees", "Safety and assurance leads", "Oversight bodies"],
    why: "Models can simulate outcomes. They cannot carry responsibility.",
    provides: [
      "A place where human judgment remains explicit",
      "A record of why a system was trusted, limited, or paused",
      "Clear accountability boundaries",
    ],
  },
  {
    id: "research",
    title: "Research, innovation, and frontier work",
    who: ["Research directors", "Grant panels", "Innovation portfolio owners", "Frontier technology teams"],
    why: "When evidence is incomplete, disagreement is expected — but must be structured.",
    provides: [
      "Assumptions surfaced early",
      "Unknowns tracked honestly",
      "Disagreement separated from ego or politics",
    ],
  },
  {
    id: "public",
    title: "Public and civic decision-making",
    who: ["Public leaders", "Commissioners", "Policy owners", "Cross-agency partnerships"],
    why: "Public decisions must be explainable, not just defensible.",
    provides: [
      "Transparent tradeoffs",
      "Explicit judgment types",
      "Artifacts that survive scrutiny",
    ],
  },
  {
    id: "human-systems",
    title: "Human systems under pressure",
    who: ["Families", "Schools", "Care systems", "Communities navigating change"],
    why: "Pressure is often felt before it can be explained.",
    provides: [
      "Language for what's happening",
      "Separation of system stress from personal blame",
      "Shared understanding without forcing solutions",
    ],
  },
];

export default function WhoItsFor() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 10 }}>
          Who Orientation Lab is for
        </div>
        <div style={{ opacity: 0.95, lineHeight: 1.6, marginBottom: 12 }}>
          Orientation Lab is for serious people facing real consequences.
        </div>
        <div style={{ opacity: 0.95, lineHeight: 1.6, marginBottom: 12 }}>
          People who understand that:
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, opacity: 0.95, lineHeight: 1.6 }}>
          <li>disagreement is often structural, not personal</li>
          <li>uncertainty is not a failure</li>
          <li>responsibility cannot be automated</li>
        </ul>
        <div style={{ marginTop: 12, opacity: 0.95, lineHeight: 1.6 }}>
          It is used wherever decisions must be made without pretending certainty exists.
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
          Expandable examples (canonical set)
        </div>
        <div style={{ opacity: 0.9, lineHeight: 1.6, marginBottom: 12 }}>
          Use these as expandable sections.<br />
          They are <strong>not industries</strong> — they are <strong>situations</strong>.
        </div>
        <div style={{ opacity: 0.9, lineHeight: 1.6 }}>
          Only include these five. They scale everywhere.
        </div>
      </Card>

      <div style={{ display: "grid", gap: 12 }}>
        {EXAMPLES.map((ex) => (
          <Card key={ex.id}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{ex.title}</div>
              <Chip>{ex.id}</Chip>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Who</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ex.who.map((w) => (
                  <Chip key={w}>{w}</Chip>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Why</div>
              <div style={{ opacity: 0.95, lineHeight: 1.6 }}>{ex.why}</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>What Orientation Lab provides</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, opacity: 0.95, lineHeight: 1.6 }}>
                {ex.provides.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <details style={{ border: "1px solid rgba(0,0,0,0.10)", borderRadius: 12, padding: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 800, marginBottom: 8 }}>
          Optional: Orientation Lab and advanced models
        </summary>
        <div style={{ marginTop: 10, opacity: 0.95, lineHeight: 1.6 }}>
          Orientation Lab does not replace simulation, prediction, or optimisation systems.
        </div>
        <div style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.6 }}>
          It is used <strong>around them</strong>.
        </div>
        <div style={{ marginTop: 8, opacity: 0.95, lineHeight: 1.6 }}>
          Whenever multiple representations exist — human or machine —<br />
          someone must still decide:
        </div>
        <ul style={{ marginTop: 8, paddingLeft: 18, display: "grid", gap: 6, opacity: 0.95, lineHeight: 1.6 }}>
          <li>which assumptions are acceptable</li>
          <li>what cannot yet be known</li>
          <li>where responsibility sits</li>
        </ul>
        <div style={{ marginTop: 10, opacity: 0.95, lineHeight: 1.6 }}>
          Orientation Lab exists for that layer.
        </div>
      </details>
    </div>
  );
}
