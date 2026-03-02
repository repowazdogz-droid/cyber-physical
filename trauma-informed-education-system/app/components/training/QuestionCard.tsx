"use client";

import React from "react";
import { Card, Pill } from "@/app/components/ui";
import type { Question } from "@/lib/training";

export function QuestionCard(props: {
  index: number;
  q: Question;
  value: string;
  onChange: (v: string) => void;
  reveal: boolean;
}) {
  const { q } = props;
  return (
    <Card className="card-pad">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-base font-medium">Q{props.index + 1}</div>
        <Pill muted>{q.kind === "MCQ" ? "multiple choice" : "short response"}</Pill>
      </div>
      <div className="text-sm text-muted-foreground mb-4">{q.prompt}</div>

      {q.kind === "MCQ" ? (
        <div className="space-y-2">
          {q.options.map((o) => {
            const selected = props.value === o.id;
            const correct = props.reveal && o.id === q.correctId;
            const wrong = props.reveal && selected && o.id !== q.correctId;
            return (
              <button
                key={o.id}
                className={`btn ${selected ? "btn-primary" : "btn-secondary"} w-full text-left justify-start`}
                style={{
                  borderColor: correct ? "rgba(34,197,94,0.35)" : wrong ? "rgba(239,68,68,0.35)" : undefined,
                }}
                onClick={() => props.onChange(o.id)}
                type="button"
              >
                <span style={{ width: 18, display: "inline-block" }}>{selected ? "●" : "○"}</span>
                <span>{o.label}</span>
              </button>
            );
          })}
          {props.reveal ? (
            <div className="text-sm mt-4 p-3 bg-muted rounded-lg">
              <strong>Why:</strong> {q.rationale}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            rows={4}
            placeholder="Type a short, neutral response…"
            className="w-full border border-border rounded-lg p-3 text-sm bg-background"
          />
          {props.reveal ? (
            <div className="space-y-2 text-sm">
              <div><strong>Good answers include:</strong></div>
              <ul className="list-disc pl-5 space-y-1">
                {q.rubric.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <div className="mt-3"><strong>Example (safe):</strong> {q.example}</div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
























