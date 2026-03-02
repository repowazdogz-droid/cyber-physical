import { Demo } from "@/app/content/demos";
import DemoOutput from "./DemoOutput";

interface DemoCardProps {
  demo: Demo;
}

export default function DemoCard({ demo }: DemoCardProps) {
  return (
    <div className="card">
      <p className="note" style={{ marginTop: 0, marginBottom: 'var(--s-3)' }}>
        Pre-verified demonstration of Omega&apos;s reasoning constraints.
      </p>
      <h3 className="h2" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--s-3)' }}>{demo.label}</h3>
      <div style={{ marginTop: 'var(--s-4)' }}>
        <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--s-2)' }}>Input:</h4>
        <p className="p-muted">{demo.input}</p>
      </div>
      <DemoOutput output={demo.output} />
    </div>
  );
}

