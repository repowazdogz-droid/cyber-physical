import Link from "next/link";
import { Card, Button, Callout, Pill } from "@/app/components/ui";
import { PageFrame } from "@/app/components/PageFrame";

export default function Home() {
  return (
    <PageFrame
      variant="home"
      title="Trauma-Informed Education System"
      subtitle="Fast, practical training for busy school days — then printable packs for your team."
      actions={
        <>
          <Link href="/training"><Button>Start Training</Button></Link>
          <Link href="/packs"><Button variant="secondary">Print a Pack</Button></Link>
          <Link href="/docs"><Button variant="secondary">Docs</Button></Link>
        </>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <Pill>V1</Pill>
        <Pill muted>Built for schools</Pill>
        <Pill muted>Adult practice + environments</Pill>
      </div>

      <Callout kind="NOTE" title="How to use this (lowest friction)">
        Start with <b>Training (3–15 minutes)</b>. Then use a <b>Pack</b> to brief staff. Use <b>Docs</b> only as a reference library.
      </Callout>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <Link href="/reflect">
          <Card className="card-pad card-action">
            <div>
              <div className="text-lg font-medium mb-2">Reflect</div>
              <div className="text-sm text-muted-foreground">Think before you respond. AI-supported reflection for challenging moments with children.</div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Pill>Dual lens</Pill>
              <span className="text-sm text-muted-foreground">Open →</span>
            </div>
          </Card>
        </Link>
        <Link href="/training">
          <Card className="card-pad card-action">
            <div>
              <div className="text-lg font-medium mb-2">Training (start here)</div>
              <div className="text-sm text-muted-foreground">Pick role + time. Do a scenario. Get a checklist/output you can use immediately.</div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Pill>3–15 min</Pill>
              <span className="text-sm text-muted-foreground">Open →</span>
            </div>
          </Card>
        </Link>
        <Link href="/packs">
          <Card className="card-pad card-action">
            <div>
              <div className="text-lg font-medium mb-2">2) Packs (print + share)</div>
              <div className="text-sm text-muted-foreground">Curated paths you can print to PDF and distribute to staff/parents.</div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Pill>PDF-ready</Pill>
              <span className="text-sm text-muted-foreground">Open →</span>
            </div>
          </Card>
        </Link>
        <Link href="/docs">
          <Card className="card-pad card-action">
            <div>
              <div className="text-lg font-medium mb-2">3) Docs (reference)</div>
              <div className="text-sm text-muted-foreground">Canonical library for deeper reading when you need it.</div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Pill muted>optional</Pill>
              <span className="text-sm text-muted-foreground">Open →</span>
            </div>
          </Card>
        </Link>
      </div>
    </PageFrame>
  );
}
