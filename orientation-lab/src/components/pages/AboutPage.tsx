export default function AboutPage() {
  return (
    <div style={{ maxWidth: 820 }}>
      <h1>Orientation Lab</h1>
      <p style={{ fontSize: 18, lineHeight: 1.6 }}>
        <strong>World orientation under uncertainty.</strong>
        <br />
        Used when reality is represented in more than one way —
        and no single representation can be allowed to decide.
      </p>

      <p style={{ lineHeight: 1.6 }}>
        When people disagree, it is rarely because they are irrational.
        It is because they are using different models, carrying different
        assumptions, and answering different kinds of questions without
        realising they are doing different things.
      </p>

      <p style={{ lineHeight: 1.6 }}>
        Orientation Lab exists to make that structure visible —
        not to resolve disagreement,
        but to make it legible.
      </p>

      <h2>What this system does</h2>
      <ul>
        <li>Surfaces competing representations without forcing consensus</li>
        <li>Separates knowledge from judgment</li>
        <li>Makes assumptions, disagreements, and unknowns explicit</li>
        <li>Keeps responsibility with people, not systems</li>
      </ul>

      <h2>What comes out</h2>
      <p>
        A single, shareable orientation artifact the room can stand behind:
      </p>
      <ul>
        <li>Which models are in play</li>
        <li>Where disagreement actually sits</li>
        <li>What remains unknown — and who owns it (as roles)</li>
        <li>What kind of judgment is required</li>
      </ul>

      <h2>Where this is used</h2>

      <details>
        <summary><strong>Human systems</strong></summary>
        <p>
          Leadership teams, families, boards, institutions, and groups
          where disagreement carries emotional, moral, or relational weight.
        </p>
        <p>
          Orientation Lab helps people realise they are not arguing about
          the same thing — and gives them a shared map before judgment begins.
        </p>
      </details>

      <details>
        <summary><strong>Technical & scientific systems</strong></summary>
        <p>
          Engineering, research, modelling, and analytical contexts where
          multiple representations of reality coexist — and none can be
          treated as authoritative by default.
        </p>
        <p>
          Orientation Lab is used when outputs conflict, assumptions diverge,
          or uncertainty cannot be reduced before action.
        </p>
      </details>

      <details>
        <summary><strong>Safety, assurance & irreversible decisions</strong></summary>
        <p>
          Contexts where errors are costly, decisions cannot be undone,
          and responsibility must remain explicit.
        </p>
        <p>
          Orientation Lab makes residual uncertainty visible
          before it is silently absorbed into risk.
        </p>
      </details>

      <h2>Boundary (intentional)</h2>
      <p>
        Orientation Lab is a thinking and facilitation system.
        It does not forecast outcomes, optimise objectives,
        recommend actions, or replace governance.
      </p>

      <p>
        If you need a decision, this will not give you one.
        If you need the room to see what it is deciding,
        it exists for that purpose.
      </p>

      <p style={{ marginTop: 24, fontStyle: "italic", opacity: 0.7 }}>
        Currently used as a thinking tool, not an operational system.
      </p>
    </div>
  );
}
