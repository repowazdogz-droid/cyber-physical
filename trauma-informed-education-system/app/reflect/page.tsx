"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageFrame } from "@/app/components/PageFrame";
import { Card, Button, Callout } from "@/app/components/ui";
import { ReflectInputForm } from "@/app/components/reflect/ReflectInputForm";
import { ReflectOutput } from "@/app/components/reflect/ReflectOutput";
import type { ReflectRequestBody } from "@/app/api/reflect/route";
import type { ReflectResponse } from "@/app/api/reflect/route";

export default function ReflectPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReflectResponse | null>(null);
  const [scenarioSummary, setScenarioSummary] = useState<string>("");

  const handleSubmit = async (body: ReflectRequestBody) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setScenarioSummary(`${body.role} • ${body.childYear} • ${body.setting}`);
    try {
      const res = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data: ReflectResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame
      variant="reflect"
      title="Reflect"
      subtitle="Think before you respond. AI-supported reflection for challenging moments with children. Every analysis uses both trauma and neurodivergence as default lenses."
      actions={
        <>
          <Link href="/training"><Button variant="secondary">Training</Button></Link>
          <Link href="/docs"><Button variant="secondary">Docs</Button></Link>
        </>
      }
    >
      <Callout kind="BOUNDARY" title="Scope">
        This tool supports reflection and planning. It does not replace safeguarding procedures. Any disclosure of abuse or neglect requires immediate DSL referral.
      </Callout>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Scenario</h2>
          <ReflectInputForm onSubmit={handleSubmit} disabled={loading} />
        </section>

        {error && (
          <Card className="card-pad border-red-200 bg-red-50 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </Card>
        )}

        {result && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Analysis</h2>
            <ReflectOutput
              sections={result.sections}
              escalationLevel={result.escalationLevel}
              raci={result.raci}
              scenarioSummary={scenarioSummary}
            />
          </section>
        )}
      </div>
    </PageFrame>
  );
}
