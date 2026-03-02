import { LANDING_COPY } from "@/app/content/landing";
import { DEMOS } from "@/app/content/demos";
import DemoCard from "@/app/components/demo/DemoCard";

export default function DemoSection() {
  const { demos } = LANDING_COPY;
  
  return (
    <section id="demos" className="section" style={{ paddingTop: 'var(--s-9)' }}>
      <div className="site-wrap">
        <div className="site-measure">
          <h2 className="h2">{demos.title}</h2>
          <p className="p-muted">{demos.subtitle}</p>
          <p className="p-muted">{demos.intro}</p>
          
          <p className="p-muted">Included examples:</p>
          <ul className="ul">
            {demos.examples.map((example, i) => (
              <li key={i}>{example}</li>
            ))}
          </ul>
          
          <p className="p-muted">Each demonstration is a:</p>
          <p className="p-muted">{demos.label}</p>
          
          <div className="grid" style={{ marginTop: 'var(--s-6)' }}>
            {DEMOS.map((demo) => (
              <DemoCard key={demo.id} demo={demo} />
            ))}
          </div>
          
          <div className="card" style={{ marginTop: 'var(--s-6)' }}>
            <h3 className="h2" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--s-3)' }}>{demos.sandbox.title}</h3>
            <ul className="ul">
              {demos.sandbox.rules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
            <p className="note">{demos.sandbox.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

