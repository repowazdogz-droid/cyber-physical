"use client";

import React, { useState } from "react";
import { exampleScenarios, type ExampleScenario } from "@/lib/data/exampleScenarios";
import type { ReflectRequestBody } from "@/app/api/reflect/route";
import { Card, Button } from "@/app/components/ui";

const defaultForm: ReflectRequestBody = {
  childAge: "",
  childYear: "",
  setting: "",
  behaviour: "",
  context: "",
  role: "",
  previousStrategies: "",
  knownDiagnoses: "",
  careExperienced: false,
  anyOtherInfo: "",
};

type Props = {
  onSubmit: (body: ReflectRequestBody) => void;
  disabled?: boolean;
};

export function ReflectInputForm({ onSubmit, disabled }: Props) {
  const [form, setForm] = useState<ReflectRequestBody>(defaultForm);

  const update = (key: keyof ReflectRequestBody, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadExample = (ex: ExampleScenario) => {
    setForm({
      ...defaultForm,
      childAge: ex.childAge,
      childYear: ex.childYear,
      setting: ex.setting,
      behaviour: ex.behaviour,
      context: ex.context,
      role: ex.role,
      previousStrategies: ex.previousStrategies,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="reflect-example" className="text-sm font-medium text-muted-foreground">
          Load example:
        </label>
        <select
          id="reflect-example"
          className="rounded border border-border bg-white px-3 py-1.5 text-sm"
          value=""
          onChange={(e) => {
            const id = e.target.value;
            if (id) {
              const ex = exampleScenarios.find((s) => s.id === id);
              if (ex) loadExample(ex);
              e.target.value = "";
            }
          }}
        >
          <option value="">Choose one…</option>
          {exampleScenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id === "meltdown-in-assembly" ? "Meltdown in Assembly (Y2)" : "Masking girl shutdown (Y10)"}
            </option>
          ))}
        </select>
      </div>

      <Card className="card-pad space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="childAge" className="block text-sm font-medium mb-1">Child age</label>
            <input
              id="childAge"
              type="text"
              required
              className="input w-full"
              placeholder="e.g. 6"
              value={form.childAge}
              onChange={(e) => update("childAge", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="childYear" className="block text-sm font-medium mb-1">Year group</label>
            <input
              id="childYear"
              type="text"
              className="input w-full"
              placeholder="e.g. Year 2"
              value={form.childYear}
              onChange={(e) => update("childYear", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="setting" className="block text-sm font-medium mb-1">Setting</label>
          <input
            id="setting"
            type="text"
            className="input w-full"
            placeholder="e.g. Assembly hall, classroom"
            value={form.setting}
            onChange={(e) => update("setting", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="behaviour" className="block text-sm font-medium mb-1">Behaviour (what you observed)</label>
          <textarea
            id="behaviour"
            required
            rows={3}
            className="input w-full"
            placeholder="Describe what happened — what the child did/said, without interpretation."
            value={form.behaviour}
            onChange={(e) => update("behaviour", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium mb-1">Context</label>
          <textarea
            id="context"
            required
            rows={3}
            className="input w-full"
            placeholder="What was going on before? Who was there? Any recent changes?"
            value={form.context}
            onChange={(e) => update("context", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">Your role</label>
          <input
            id="role"
            type="text"
            className="input w-full"
            placeholder="e.g. Class Teacher, Head of Year, SENCO"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="previousStrategies" className="block text-sm font-medium mb-1">Previous strategies tried</label>
          <textarea
            id="previousStrategies"
            rows={2}
            className="input w-full"
            placeholder="What has already been tried? What worked or didn't?"
            value={form.previousStrategies}
            onChange={(e) => update("previousStrategies", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="knownDiagnoses" className="block text-sm font-medium mb-1">
            Known diagnoses or assessments (if any)
          </label>
          <input
            id="knownDiagnoses"
            type="text"
            className="input w-full"
            placeholder="e.g. Autism, ADHD, awaiting assessment, no formal diagnosis"
            value={form.knownDiagnoses ?? ""}
            onChange={(e) => update("knownDiagnoses", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="careExperienced"
            type="checkbox"
            checked={form.careExperienced ?? false}
            onChange={(e) => update("careExperienced", e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="careExperienced" className="text-sm font-medium">
            This child is care-experienced (looked after, previously looked after, or on a child protection plan)
          </label>
        </div>

        <div>
          <label htmlFor="anyOtherInfo" className="block text-sm font-medium mb-1">Any other relevant info</label>
          <textarea
            id="anyOtherInfo"
            rows={2}
            className="input w-full"
            placeholder="Optional"
            value={form.anyOtherInfo ?? ""}
            onChange={(e) => update("anyOtherInfo", e.target.value)}
          />
        </div>
      </Card>

      <Button type="submit" disabled={disabled}>
        {disabled ? "Analysing…" : "Analyse scenario"}
      </Button>
    </form>
  );
}
