import Link from "next/link";
import { PageHead, Button, Callout } from "../components/ui";

export default function About() {
  return (
    <div className="stack">
      <PageHead
        title="What this system focuses on"
        subtitle="A practical, inspection-safe trauma-informed operating system for schools: shared language, repeatable processes, and light-weight implementation cycles. Built on the Matching Principle (Ward, 1998): the support we give practitioners should mirror the support we expect them to give children. Every analysis considers both trauma and neurodivergence as default lenses — because the question is never whether a child is affected by these, but how."
      >
        <Button href="/start" variant="primary">Start wizard</Button>
        <Button href="/packs">Browse packs</Button>
      </PageHead>

      <div className="grid2">
        <section className="card">
          <h2>This is</h2>
          <ul className="list">
            <li><b>A shared language</b> for safety, predictability, regulation, and repair.</li>
            <li><b>A set of processes</b> staff can use under pressure (before/during/after dysregulation).</li>
            <li><b>A 90-day cycle</b> so change is small, repeatable, and sustainable.</li>
            <li><b>Packs</b> that package what to read/do in 5–60 minutes.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Scope & responsibility</h2>
          <p className="p">
            This system is designed to support adult decision-making, system design,
            and predictable environments in educational settings.
            It does not replace safeguarding processes or statutory responsibilities,
            which always remain with the school.
          </p>
          <Callout kind="STOP" title="Stop line">
            If a request becomes child-specific advice, diagnosis, prediction, or safeguarding judgement—pause and hand off to appropriate processes.
          </Callout>
        </section>
      </div>

      <section className="card">
        <h2>How to talk about this (inspection-safe)</h2>
        <p className="p">
          Use &quot;evidence-informed&quot; and &quot;supports staff consistency / predictable environments / repair routines&quot;.
          Avoid causal claims like &quot;reduces trauma&quot; or &quot;improves attainment&quot;.
        </p>
        <div className="row">
          <Button href="/docs/evidence/claims-discipline">Claims discipline</Button>
          <Button href="/docs/governance/safeguarding">Safeguarding boundary</Button>
          <Button href="/docs/delivery/inspection-framing">Inspection framing</Button>
        </div>
      </section>

      <section className="card">
        <h2>Who this is for</h2>
        <div className="grid3">
          <div className="mini">
            <div className="pill">Leadership</div>
            <div className="small">System coherence, time protection, predictable routines, repair culture.</div>
            <Link className="link" href="/roles/leadership">Open portal →</Link>
          </div>
          <div className="mini">
            <div className="pill">Staff</div>
            <div className="small">Practical responses under pressure, language consistency, adult capacity.</div>
            <Link className="link" href="/roles/staff">Open portal →</Link>
          </div>
          <div className="mini">
            <div className="pill">Parents</div>
            <div className="small">Clear boundaries, calmer communication, predictable interfaces.</div>
            <Link className="link" href="/roles/parents">Open portal →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
