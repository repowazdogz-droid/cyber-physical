import Link from "next/link";
import { PageHead, Button, Callout } from "../components/ui";

export default function Deploy() {
  return (
    <div className="stack">
      <PageHead
        title="Run this with near-zero founder time"
        subtitle="The system is designed to be adopted asynchronously with bounded touchpoints. This page shows how a school can run it independently, safely, and without &quot;expert dependency&quot;."
      >
        <Button href="/packs" variant="primary">Choose a pack</Button>
        <Button href="/implementation">Implementation dashboard</Button>
      </PageHead>

      <div className="grid2">
        <section className="card">
          <h2>Default deployment (recommended)</h2>
          <ol className="list">
            <li><b>Leadership picks a pack</b> (5min or 60min) and shares the print link.</li>
            <li><b>Run Orientation</b> (Days 1–30): language + one process map.</li>
            <li><b>Run Practice</b> (Days 31–60): micro-habits only (remove before you add).</li>
            <li><b>Run Reflection</b> (Days 61–90): optional, non-evaluative, systems-level.</li>
          </ol>
          <Callout kind="NOTE" title="Time rule">
            if you add a meeting, remove a meeting. If you add a form, remove a form.
          </Callout>
        </section>

        <section className="card">
          <h2>Safety boundaries</h2>
          <ul className="list">
            <li><b>No child case consultation</b> inside this system.</li>
            <li><b>No disclosure prompts</b> in staff sessions.</li>
            <li><b>Safeguarding stays with DSL</b>; this does not adjudicate risk.</li>
            <li><b>AI is for wording + structure</b>, not judgement or prediction.</li>
          </ul>
          <div className="row">
            <Button href="/docs/governance/refusal-boundaries">Refusal scripts</Button>
            <Button href="/docs/ai/ai-guardrails">AI guardrails</Button>
          </div>
        </section>
      </div>

      <section className="card">
        <h2>Suggested operating roles</h2>
        <div className="grid3">
          <div className="mini">
            <div className="pill">Sponsor</div>
            <div className="small">Owns the time protection rule and &quot;no extra work&quot; enforcement.</div>
          </div>
          <div className="mini">
            <div className="pill">Steward</div>
            <div className="small">Keeps the language/processes consistent; protects boundaries.</div>
          </div>
          <div className="mini">
            <div className="pill">Facilitator</div>
            <div className="small">Runs the modules; uses boundary scripts; stops sessions if needed.</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Downloadable pack format</h2>
        <p className="p">
          Packs are printable pages designed for sharing with staff, governors, and stakeholders. Use the &quot;Print/Save PDF&quot;
          button in any pack. Keep language inspection-safe (see Claims Discipline).
        </p>
        <div className="row">
          <Button href="/packs/leadership-60min/print">Example print page</Button>
          <Button href="/docs/evidence/claims-discipline">Claims discipline</Button>
        </div>
      </section>
    </div>
  );
}
