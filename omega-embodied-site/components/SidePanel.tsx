"use client";

import { useEffect } from "react";
import type { PlatformNode } from "@/data/platform";

interface SidePanelProps {
  node: PlatformNode | null;
  connections: PlatformNode[];
  isOpen: boolean;
  onClose: () => void;
}

export default function SidePanel({
  node,
  connections,
  isOpen,
  onClose
}: SidePanelProps) {
  useEffect(() => {
    if (
      !isOpen ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !node) return null;

  const hasActions = node.actions.length > 0;
  const hasLinks = node.links && node.links.length > 0;
  const hasConnections = connections.length > 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-end md:items-stretch"
      role="dialog"
      aria-modal="true"
      aria-labelledby="omega-node-panel-title"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/5 backdrop-blur-[1px] transition-opacity duration-200 ease-out"
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full transform rounded-t-2xl border-t border-zinc-200/80 bg-white shadow-xl transition-transform duration-200 ease-out md:h-full md:max-h-screen md:w-[380px] md:rounded-none md:border-l md:border-t-0"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200/60 px-5 py-4">
          <div>
            <h2
              id="omega-node-panel-title"
              className="text-sm font-semibold tracking-tight text-zinc-900"
            >
              {node.title}
            </h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              {node.tagline}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-xs text-zinc-500 shadow-sm transition-colors hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            aria-label="Close details"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-zinc-700">
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Description
            </h3>
            <p>{node.description}</p>
          </section>

          <section className="grid gap-3 text-xs text-zinc-600 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-zinc-500">Status</p>
              <p className="mt-0.5 text-zinc-800">{node.status}</p>
            </div>
            {node.proof && (
              <div>
                <p className="font-semibold text-zinc-500">Proof</p>
                <p className="mt-0.5">{node.proof}</p>
              </div>
            )}
          </section>

          {hasConnections && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Connections
              </h3>
              <div className="flex flex-wrap gap-2">
                {connections.map((conn) => (
                  <span
                    key={conn.id}
                    className="rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                  >
                    {conn.title}
                  </span>
                ))}
              </div>
            </section>
          )}

          {hasActions && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {node.actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </section>
          )}

          {hasLinks && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Links
              </h3>
              <ul className="space-y-1 text-xs text-zinc-700">
                {node.links!.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="underline underline-offset-4 transition-colors hover:text-zinc-900"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

