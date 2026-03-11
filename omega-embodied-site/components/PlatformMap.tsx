"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  PLATFORM,
  PLATFORM_PREVIEW_IDS,
  type PlatformCategory,
  type PlatformNode
} from "@/data/platform";
import NodeCard from "./NodeCard";
import SidePanel from "./SidePanel";

interface PlatformMapProps {
  variant?: "full" | "preview";
}

interface NodeIndex {
  byId: Map<string, PlatformNode>;
  orderedNodes: PlatformNode[];
}

function buildIndexAndOrder(categories: PlatformCategory[]): NodeIndex {
  const entries: [string, PlatformNode][] = [];
  const orderedNodes: PlatformNode[] = [];

  for (const category of categories) {
    for (const node of category.nodes) {
      entries.push([node.id, node]);
      orderedNodes.push(node);
    }
  }

  return { byId: new Map(entries), orderedNodes };
}

export default function PlatformMap({ variant = "full" }: PlatformMapProps) {
  const categories = PLATFORM.categories;
  const router = useRouter();
  const searchParams = useSearchParams();

  const { byId, orderedNodes } = useMemo(
    () => buildIndexAndOrder(categories),
    [categories]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = selectedId ? byId.get(selectedId) ?? null : null;
  const connections: PlatformNode[] =
    selectedNode?.connections
      .map((id) => byId.get(id))
      .filter((n): n is PlatformNode => Boolean(n)) ?? [];

  useEffect(() => {
    if (variant !== "full") return;
    const nodeId = searchParams.get("node");
    if (nodeId && byId.has(nodeId)) {
      setSelectedId(nodeId);
    } else {
      setSelectedId(null);
    }
  }, [variant, searchParams, byId]);

  const closePanel = () => {
    setSelectedId(null);
    router.replace("/platform");
  };

  if (variant === "preview") {
    const previewNodes: PlatformNode[] =
      PLATFORM_PREVIEW_IDS.map((id) => byId.get(id)).filter(
        (n): n is PlatformNode => Boolean(n)
      ) || orderedNodes.slice(0, 8);

    return (
      <div className="space-y-4">
        <div className="max-w-2xl text-xs leading-relaxed text-zinc-600">
          <p>
            A first glimpse of the platform map — a few core nodes from
            protocols, runtimes, XR, simulation, and agents.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {previewNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onSelect={() => router.push(`/platform?node=${node.id}`)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="max-w-2xl text-sm leading-relaxed text-zinc-600">
        <p>
          This is the OMEGA platform as a map: protocols, runtimes, proofs,
          embodiment, XR, simulation, and agents — structured as calm,
          explainable nodes instead of a dashboard.
        </p>
      </div>

      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.id} className="space-y-4">
            <header className="space-y-1">
              <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                {category.title}
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
                {category.description}
              </p>
            </header>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {category.nodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  onSelect={() => {
                    router.replace(`/platform?node=${node.id}`);
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <SidePanel
        node={selectedNode}
        connections={connections}
        isOpen={Boolean(selectedNode)}
        onClose={closePanel}
      />
    </div>
  );
}

