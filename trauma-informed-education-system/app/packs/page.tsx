import Link from "next/link";
import { PACKS } from "@/lib/packs";
import { Pill, Button } from "@/app/components/ui";
import { PageFrame } from "@/app/components/PageFrame";

export default function PacksIndex() {
  const audOrder: Record<string, number> = { leadership: 0, staff: 1, parents: 2 };
  const durOrder: Record<string, number> = { "5 minutes": 0, "30 minutes": 1, "60 minutes": 2 };
  const sorted = [...PACKS].sort((a, b) => {
    const ao = (audOrder[a.audience] ?? 9) - (audOrder[b.audience] ?? 9);
    if (ao !== 0) return ao;
    return (durOrder[a.duration] ?? 9) - (durOrder[b.duration] ?? 9);
  });

  return (
    <PageFrame
      variant="packs"
      title="Packs"
      subtitle="Curated, time-boxed paths. Open one, then Print/Save PDF for staff."
      actions={
        <>
          <Link href="/start"><Button>Start</Button></Link>
          <Link href="/training"><Button variant="secondary">Training</Button></Link>
        </>
      }
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((pack) => (
          <Link key={pack.id} href={`/packs/${pack.id}`} className="card card-pad card-action hover:opacity-95">
            <div className="flex gap-2 mb-2 flex-wrap">
              <Pill>{pack.audience}</Pill>
              <Pill>{pack.duration}</Pill>
              {(pack.id === "leadership-60min" || pack.id === "staff-60min") && (
                <Pill className="bg-primary/10 text-primary border-primary/20">recommended</Pill>
              )}
            </div>
            <div className="text-lg font-medium">{pack.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{pack.description}</div>
            <div className="text-sm text-muted-foreground mt-2 text-xs">
              {pack.items.length} document{pack.items.length !== 1 ? "s" : ""}
            </div>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
