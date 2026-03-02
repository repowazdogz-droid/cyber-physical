import Link from "next/link";
import { Page, Card } from "../components/Page";

const PHASES = [
  {
    id: "orientation",
    title: "Orientation",
    description: "Understanding the system and boundaries",
    items: [
      { title: "Review core principles", href: "/docs/foundations/principles" },
      { title: "Understand what this is / isn't", href: "/docs/foundations/principles" },
      { title: "Review safeguarding boundaries", href: "/docs/governance/safeguarding" },
      { title: "Review claims discipline", href: "/docs/evidence/claims-discipline" },
    ],
  },
  {
    id: "practice",
    title: "Practice",
    description: "Implementing the framework",
    items: [
      { title: "Review the four pillars", href: "/docs/framework/pillars" },
      { title: "Learn process maps", href: "/docs/framework/process-maps" },
      { title: "Start Module 01: Foundations", href: "/docs/delivery/modules/module-01-foundations" },
      { title: "Begin Module 02: Leadership Systems", href: "/docs/delivery/modules/module-02-leadership-systems" },
      { title: "Implement Module 03: Classroom Predictability", href: "/docs/delivery/modules/module-03-classroom-predictability" },
    ],
  },
  {
    id: "reflection",
    title: "Reflection",
    description: "Learning and adjustment",
    items: [
      { title: "Use reflection tools", href: "/docs/delivery/reflection-tools" },
      { title: "Review implementation cycles", href: "/docs/delivery/implementation-cycles" },
      { title: "Adjust based on learning", href: "/docs/delivery/implementation-cycles" },
    ],
  },
];

export default function ImplementationDashboard() {
  return (
    <Page
      title="Implementation"
      subtitle="A 90-day cycle that protects time and reduces drift."
      actions={
        <a className="btn-primary" href="/packs">Choose a pack</a>
      }
    >
      <Card>
        <div className="kicker mb-2">Time Protection</div>
        <p className="sub">
          This system is designed to protect your time. Implementation is self-paced, and modules are asynchronous.{" "}
          <Link href="/docs/delivery/implementation-cycles" className="text-primary hover:underline">Learn about time protection →</Link>
        </p>
      </Card>

      <div className="space-y-4">
        {PHASES.map((phase) => (
          <Card key={phase.id}>
            <div className="pill mb-2">{phase.id}</div>
            <div className="h2">{phase.title}</div>
            <div className="sub mt-1">{phase.description}</div>
            <ul className="list-disc pl-5 mt-4 space-y-1">
              {phase.items.map((item, idx) => (
                <li key={idx}>
                  <Link href={item.href} className="text-primary hover:underline">{item.title}</Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <div className="kicker mb-2">No Promises</div>
        <p className="sub">
          This dashboard provides navigation and framing only. It does not promise outcomes or guarantee results.{" "}
          <Link href="/docs/evidence/claims-discipline" className="text-primary hover:underline">Review claims discipline →</Link>
        </p>
      </Card>
    </Page>
  );
}
