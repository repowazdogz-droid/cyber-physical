import Link from "next/link";
import { Card, Pill, Button } from "@/app/components/ui";
import { PageFrame } from "@/app/components/PageFrame";

const ESSENTIAL = [
  { title: "Principles", desc: "What this is / isn't. Sets boundaries and tone.", href: "/docs/foundations/principles" },
  { title: "Pillars", desc: "The 4-part system leaders steward.", href: "/docs/framework/pillars" },
  { title: "Role translations", desc: "Who does what (and what not).", href: "/docs/framework/role-translations" },
  { title: "Implementation cycles", desc: "90-day rollout without overload.", href: "/docs/delivery/implementation-cycles" },
  { title: "Inspection framing", desc: "How to describe it safely.", href: "/docs/delivery/inspection-framing" },
  { title: "Safeguarding boundary", desc: "Stop lines and escalation rules.", href: "/docs/governance/safeguarding" },
  { title: "Core offer", desc: "What schools are buying (non-claims).", href: "/docs/business/core-offer" },
];

const PACKS = [
  { title: "Leadership Quick Start (5 min)", desc: "Fast orientation for SLT.", href: "/packs/leadership-5min" },
  { title: "Leadership Deep Dive (60 min)", desc: "System setup + deployment plan.", href: "/packs/leadership-60min" },
];

const THIS_WEEK = [
  { title: "Confirm boundaries", desc: "Review principles so the system can't be misused.", href: "/docs/foundations/principles" },
  { title: "Choose a 90-day cycle", desc: "Pick dates + remove one competing initiative.", href: "/implementation" },
  { title: "Align your pillars", desc: "Spot the missing pillar driving friction.", href: "/docs/framework/pillars" },
  { title: "Inspection language ready", desc: "Agree a 3-sentence description leaders share.", href: "/docs/delivery/inspection-framing" },
  { title: "Safeguarding stop-lines", desc: "Make escalation explicit and non-negotiable.", href: "/docs/governance/safeguarding" },
];

export default function LeadershipPortal() {
  return (
    <PageFrame
      variant="about"
      title="Leadership Portal"
      subtitle="Fast, school-safe guidance for SLT: system design, implementation cycles, and inspection readiness."
      actions={
        <>
          <Link href="/training?role=leadership&time=7&topic=inspection"><Button>Start training</Button></Link>
          <Link href="/packs/leadership-60min"><Button variant="secondary">Open recommended pack</Button></Link>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-pad">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-lg font-medium">Quick actions</div>
              <div className="text-sm text-muted-foreground">For busy leaders: pick one.</div>
            </div>
            <Pill muted>5–15 min</Pill>
          </div>
          <div className="space-y-2 mt-3">
            <Link href="/packs/leadership-5min" className="btn btn-secondary block text-center">Open Leadership Quick Start</Link>
            <Link href="/implementation" className="btn btn-secondary block text-center">Open 90-day implementation dashboard</Link>
            <Link href="/docs/delivery/inspection-framing" className="btn btn-secondary block text-center">Get inspection-safe wording</Link>
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-lg font-medium">Recommended packs</div>
              <div className="text-sm text-muted-foreground">Printable paths for staff teams.</div>
            </div>
            <Pill>recommended</Pill>
          </div>
          <div className="space-y-3 mt-3">
            {PACKS.map((x) => (
              <Link key={x.href} href={x.href} className="card-action block">
                <div className="text-base font-medium">{x.title}</div>
                <div className="text-sm text-muted-foreground">{x.desc}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="pt-6 border-t mt-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-lg font-medium">Essential reading</div>
            <div className="text-sm text-muted-foreground">Short descriptions so it feels like choices, not a wall.</div>
          </div>
          <Link href="/docs" className="btn btn-ghost">Browse all docs →</Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {ESSENTIAL.map((x) => (
            <Link key={x.href} href={x.href}>
              <Card className="card-pad card-action">
                <div>
                  <div className="text-base font-medium">{x.title}</div>
                  <div className="text-sm text-muted-foreground">{x.desc}</div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Pill muted>doc</Pill>
                  <span className="text-sm text-muted-foreground">Open →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t mt-6">
        <div className="text-lg font-medium mb-2">What to do this week</div>
        <div className="text-sm text-muted-foreground mb-4">Clickable tiles (so it behaves like an app).</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {THIS_WEEK.map((x) => (
            <Link key={x.href} href={x.href}>
              <Card className="card-pad card-action">
                <div>
                  <div className="text-base font-medium">{x.title}</div>
                  <div className="text-sm text-muted-foreground">{x.desc}</div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Pill muted>this week</Pill>
                  <span className="text-sm text-muted-foreground">Open →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
