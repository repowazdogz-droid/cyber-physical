import Link from "next/link";
import { PageHead, Card, Button } from "@/app/components/ui";

export default function Trusts() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Trusts / Local Authorities"
        subtitle="System-level framing: governance boundaries, claims discipline, and scalable implementation without founder dependency."
      />

      {/* PRIMARY ACTIONS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-pad">
          <h3 className="text-lg font-medium mb-2">Start here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Leadership pack for system-level understanding and deployment.
          </p>
          <Link href="/packs/leadership-60min">
            <Button>Leadership pack (60m)</Button>
          </Link>
        </Card>

        <Card className="card-pad">
          <h3 className="text-lg font-medium mb-2">Implementation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Dashboard for planning and tracking implementation cycles.
          </p>
          <Link href="/implementation">
            <Button variant="secondary">Implementation dashboard</Button>
          </Link>
        </Card>
      </div>

      {/* GOVERNANCE & BOUNDARIES */}
      <section className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Governance & boundaries</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/docs/governance/safeguarding">
            <Card className="card-pad card-action text-center">
              Safeguarding boundary
            </Card>
          </Link>
          <Link href="/docs/governance/ethics">
            <Card className="card-pad card-action text-center">
              Ethics
            </Card>
          </Link>
          <Link href="/docs/governance/refusal-boundaries">
            <Card className="card-pad card-action text-center">
              Refusal boundaries
            </Card>
          </Link>
        </div>
      </section>

      {/* EVIDENCE & COMMUNICATIONS */}
      <section className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Evidence & communications</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/docs/evidence/claims-discipline">
            <Card className="card-pad card-action text-center">
              Claims discipline
            </Card>
          </Link>
          <Link href="/docs/evidence/research-map">
            <Card className="card-pad card-action text-center">
              Research map
            </Card>
          </Link>
          <Link href="/docs/delivery/inspection-framing">
            <Card className="card-pad card-action text-center">
              Inspection framing
            </Card>
          </Link>
        </div>
      </section>

      {/* SCALE WITHOUT FOUNDER DEPENDENCY */}
      <section className="pt-6 border-t">
        <Card className="card-pad">
          <h2 className="text-xl font-semibold mb-3">Scale without founder dependency</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Use packs + implementation cycles + clear refusal boundaries. If a school asks for child-specific advice, the system stops and hands off to safeguarding leads or appropriate services.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/deploy">
              <Button>Deployment guide</Button>
            </Link>
            <Link href="/docs/ai/ai-guardrails">
              <Button variant="secondary">AI guardrails</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
