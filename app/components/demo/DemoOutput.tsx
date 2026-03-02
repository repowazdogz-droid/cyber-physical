import { DemoOutput as DemoOutputType } from "@/app/content/demos";

interface DemoOutputProps {
  output: DemoOutputType;
}

export default function DemoOutput({ output }: DemoOutputProps) {
  return (
    <div style={{ marginTop: 'var(--s-4)' }}>
      <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--s-2)' }}>Output:</h4>
      <div style={{ marginTop: 'var(--s-3)' }}>
        <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--s-2)', color: 'var(--muted)' }}>Claims:</h5>
        <ul className="ul">
          {output.claims.map((claim, i) => (
            <li key={i}>{claim}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 'var(--s-3)' }}>
        <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--s-2)', color: 'var(--muted)' }}>Evidence:</h5>
        <ul className="ul">
          {output.evidence.map((evidence, i) => (
            <li key={i}>{evidence}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 'var(--s-3)' }}>
        <h5 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--s-2)', color: 'var(--muted)' }}>Unknowns:</h5>
        <ul className="ul">
          {output.unknowns.map((unknown, i) => (
            <li key={i}>{unknown}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

