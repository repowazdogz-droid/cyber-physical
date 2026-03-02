import Link from "next/link";

const LINKS = [
  { title: "Training", href: "/training" },
  { title: "Start Wizard", href: "/start" },
  { title: "Packs", href: "/packs" },
  { title: "Implementation", href: "/implementation" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick start
        </div>
        <div className="flex flex-col gap-1">
          {LINKS.map((x) => (
            <Link key={x.href} href={x.href} className="sidebarLink">
              {x.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
