import type { PlatformNode } from "@/data/platform";

interface NodeCardProps {
  node: PlatformNode;
  onSelect: () => void;
}

function statusStyles(status: PlatformNode["status"]): string {
  switch (status) {
    case "Live":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Built":
    case "Installed":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "Planned":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Exploring":
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-100";
  }
}

export default function NodeCard({ node, onSelect }: NodeCardProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col rounded-2xl border border-zinc-200/60 bg-white p-4 text-left shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
          {node.title}
        </h3>
        <span
          className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusStyles(
            node.status
          )}`}
        >
          {node.status}
        </span>
      </div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
        {node.tagline}
      </p>
      <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
        {node.description}
      </p>
    </div>
  );
}

