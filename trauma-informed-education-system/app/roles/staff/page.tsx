import Link from "next/link";
import { PageHead, Card, Button } from "@/app/components/ui";

export default function StaffPortal() {
  return (
    <div className="space-y-6">
      <PageHead
        title="Staff Portal"
        subtitle="Tools for teachers and support staff: predictability, repair processes, and regulation support."
      />

      {/* PRIMARY ACTIONS */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-pad">
          <h3 className="text-lg font-medium mb-2">Start here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            A quick introduction to trauma-informed practice in your role.
          </p>
          <Link href="/training?role=staff&time=7&topic=predictability">
            <Button>Start training</Button>
          </Link>
        </Card>

        <Card className="card-pad">
          <h3 className="text-lg font-medium mb-2">Go deeper</h3>
          <p className="text-sm text-muted-foreground mb-4">
            For staff ready to implement classroom predictability and repair processes.
          </p>
          <Link href="/packs/staff-60min">
            <Button variant="secondary">Open recommended pack</Button>
          </Link>
        </Card>
      </div>

      {/* THIS WEEK */}
      <section className="pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">This week</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/docs/foundations/principles">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Review core principles</strong>
              <p className="text-sm text-muted-foreground">Understand trauma-informed practice.</p>
            </Card>
          </Link>

          <Link href="/docs/framework/pillars">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Learn the four pillars</strong>
              <p className="text-sm text-muted-foreground">Foundation for all practice.</p>
            </Card>
          </Link>

          <Link href="/docs/delivery/modules/module-03-classroom-predictability">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Start Module 03</strong>
              <p className="text-sm text-muted-foreground">Classroom predictability.</p>
            </Card>
          </Link>

          <Link href="/docs/framework/process-maps">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Review process maps</strong>
              <p className="text-sm text-muted-foreground">Respond, repair, escalate.</p>
            </Card>
          </Link>

          <Link href="/docs/delivery/reflection-tools">
            <Card className="card-pad card-action">
              <strong className="block mb-1">Use reflection tools</strong>
              <p className="text-sm text-muted-foreground">Support your learning.</p>
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
            { href: "/docs/framework/pillars", label: "Pillars" },
            { href: "/docs/framework/process-maps", label: "Process maps" },
            { href: "/docs/delivery/modules/module-01-foundations", label: "Module 01" },
            { href: "/docs/delivery/modules/module-04-repair-boundaries", label: "Module 04" },
            { href: "/docs/delivery/reflection-tools", label: "Reflection tools" },
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
