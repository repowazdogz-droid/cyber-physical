import Link from "next/link";
import { PageHead, Card, Button } from "@/app/components/ui";

export default function ParentsPortal() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Parents & Carers Portal"
        subtitle="Information for parents and carers: understanding the system, language, and what to expect."
      />

      {/* PRIMARY ACTIONS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-pad">
          <h3 className="text-lg font-medium mb-2">Start here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            A quick overview of what this system means for families.
          </p>
          <Link href="/training?role=parents&time=7&topic=boundaries">
            <Button>Start training</Button>
          </Link>
        </Card>

        <Card className="card-pad">
          <h3 className="text-lg font-medium mb-2">Go deeper</h3>
          <p className="text-sm text-muted-foreground mb-4">
            For parents who want to understand the full system and boundaries.
          </p>
          <Link href="/packs/parents-30min">
            <Button variant="secondary">Open recommended pack</Button>
          </Link>
        </Card>
      </div>

      {/* THIS WEEK */}
      <section className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">What to know</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/docs/foundations/principles">
            <Card className="card-pad card-action">
              <strong className="block mb-1">What this system is</strong>
              <p className="text-sm text-muted-foreground">Understanding trauma-informed practice.</p>
            </Card>
          </Link>

          <Link href="/docs/framework/role-translations">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Your role</strong>
              <p className="text-sm text-muted-foreground">How parents fit into the system.</p>
            </Card>
          </Link>

          <Link href="/docs/delivery/modules/module-07-parent-interface">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Parent interface</strong>
              <p className="text-sm text-muted-foreground">How to engage.</p>
            </Card>
          </Link>

          <Link href="/docs/governance/ethics">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Ethical commitments</strong>
              <p className="text-sm text-muted-foreground">What the system promises.</p>
            </Card>
          </Link>

          <Link href="/docs/governance/refusal-boundaries">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Boundaries</strong>
              <p className="text-sm text-muted-foreground">What the system doesn't do.</p>
            </Card>
          </Link>
        </div>
      </section>

      {/* OPTIONAL READING */}
      <section className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Explore resources</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { href: "/docs/foundations/principles", label: "Principles" },
            { href: "/docs/framework/role-translations", label: "Role translations" },
            { href: "/docs/delivery/modules/module-07-parent-interface", label: "Parent interface" },
            { href: "/docs/governance/ethics", label: "Ethics" },
            { href: "/docs/governance/refusal-boundaries", label: "Boundaries" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="card-pad card-action text-center">
                {item.label}
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
