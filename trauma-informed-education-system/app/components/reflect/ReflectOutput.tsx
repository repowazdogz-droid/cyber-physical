"use client";

import React, { useState } from "react";
import type { ReflectSections, EscalationLevel } from "@/app/api/reflect/route";
import { REFLECT_OUTPUT_SECTION_ORDER } from "@/lib/prompts/reflectPrompt";
import { EscalationBadge } from "./EscalationBadge";
import { RACISection } from "./RACISection";
import { PrintButton } from "./PrintButton";

type Props = {
  sections: ReflectSections;
  escalationLevel: EscalationLevel;
  raci?: { responsible?: string; accountable?: string; consulted?: string; informed?: string };
  scenarioSummary?: string;
};

export function ReflectOutput({ sections, escalationLevel, raci, scenarioSummary }: Props) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(REFLECT_OUTPUT_SECTION_ORDER.slice(0, 3)));

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const order = [...REFLECT_OUTPUT_SECTION_ORDER];
  const isRACI = (title: string) => title === "Who Needs to Know? (RACI)";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EscalationBadge level={escalationLevel} />
        <PrintButton
          sections={sections}
          escalationLevel={escalationLevel}
          scenarioSummary={scenarioSummary}
        />
      </div>

      <div className="space-y-2">
        {order.filter((title) => sections[title]).map((title) => {
          const isOpen = openKeys.has(title);
          const content = sections[title];
          return (
            <div
              key={title}
              className="border border-border rounded-lg overflow-hidden bg-white"
            >
              <button
                type="button"
                onClick={() => toggle(title)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-muted/50 transition-colors"
              >
                <span>{title}</span>
                <span className="text-muted-foreground" aria-hidden>
                  {isOpen ? "▼" : "▶"}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-border">
                  {isRACI(title) && raci ? (
                    <RACISection raci={raci} markdown={content} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed">
                      {content}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
