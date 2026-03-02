"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Pill, Callout } from "@/app/components/ui";
import { PageFrame } from "@/app/components/PageFrame";
import { roles, topics, filterScenarios, buildDraftOutputs, scenarios, type TrainingRole, type TrainingTime, type TrainingTopic } from "@/lib/training";
import { QuestionCard } from "@/app/components/training/QuestionCard";

function asRole(x: string | null): TrainingRole | null {
  const v = (x || "").toLowerCase().trim();
  if (v === "leadership" || v === "staff" || v === "parents" || v === "trusts") {
    return v as TrainingRole;
  }
  return null;
}

function asTime(x: string | null): TrainingTime | null {
  const v = (x || "").trim();
  if (v === "3" || v === "7" || v === "15") {
    return v as TrainingTime;
  }
  return null;
}

function asTopic(x: string | null): TrainingTopic | "any" | null {
  const v = (x || "").toLowerCase().trim();
  if (v === "any") return "any";
  if (v === "predictability" || v === "repair" || v === "adult-regulation" || v === "boundaries" || v === "inspection" || v === "neurodivergence") {
    return v as TrainingTopic;
  }
  return null;
}

export default function TrainingClient() {
  const sp = useSearchParams();

  const [role, setRole] = useState<TrainingRole>("staff");
  const [time, setTime] = useState<TrainingTime>("7");
  const [topic, setTopic] = useState<TrainingTopic | "any">("any");
  const [scenarioId, setScenarioId] = useState<string>("");
  const [reveal, setReveal] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const all = useMemo(() => scenarios(), []);
  const available = useMemo(() => filterScenarios({ role, time, topic }), [role, time, topic]);
  const scenario = useMemo(() => {
    if (scenarioId) {
      const found = available.find((s) => s.id === scenarioId);
      if (found) return found;
    }
    return available[0] ?? null;
  }, [available, scenarioId]);

  // Apply URL defaults once (role/time/topic/scenario). Does NOT loop.
  useEffect(() => {
    const r = asRole(sp.get("role"));
    const t = asTime(sp.get("time"));
    const k = asTopic(sp.get("topic"));
    const sid = (sp.get("scenario") || "").trim();

    if (r) setRole(r);
    if (t) setTime(t);
    if (k) setTopic(k);

    // Scenario preselect: if provided in URL, use it; otherwise will be auto-selected by next effect
    if (sid) {
      const hit = all.find((s) => s.id === sid);
      if (hit) {
        setScenarioId(hit.id);
        return; // Don't auto-select if we found the URL scenario
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Auto-pick first scenario when filters change and none is selected (or selected no longer matches)
  useEffect(() => {
    if (scenarioId && available.some((s) => s.id === scenarioId)) {
      // Current scenario still matches, keep it
      return;
    }
    if (available.length > 0 && !scenarioId) {
      setScenarioId(available[0].id);
    }
    setReveal(false);
    setAnswers({});
  }, [available, scenarioId]);

  const draft = useMemo(() => {
    if (!scenario) return null;
    return buildDraftOutputs(scenario, {
      schoolType: "School setting (edit as needed)",
      audienceNote: role === "leadership" ? "SLT / governors" : role === "parents" ? "Parents/carers" : "Staff team",
    });
  }, [scenario, role]);

  return (
    <PageFrame
      variant="training"
      title="Training Mode"
      subtitle="3–15 minute interactive training. Scenarios + questions + ready-to-share outputs (no long reading)."
      actions={
        <>
          <Link href="/packs"><Button variant="secondary">Packs</Button></Link>
          <Link href="/docs"><Button variant="secondary">Docs</Button></Link>
        </>
      }
    >
      <Callout kind="BOUNDARY" title="Scope & responsibility">
        Scenarios focus on adult responses and system decisions.
        Child-specific concerns should always be addressed through the school's safeguarding processes.
      </Callout>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <Card className="card-pad">
          <div className="text-base font-medium mb-2">1) Choose role</div>
          <div className="space-y-2 mt-3">
            {roles().map((r) => (
              <button
                key={r.id}
                type="button"
                className={`btn w-full text-left justify-start ${role === r.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setRole(r.id)}
              >
                <div>
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="card-pad">
          <div className="text-base font-medium mb-2">2) Time + topic</div>
          <div className="text-sm text-muted-foreground mb-3">Pick something that fits the day.</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["3","7","15"] as const).map((t) => (
              <button key={t} type="button" className={`btn ${time === t ? "btn-primary" : "btn-secondary"}`} onClick={() => setTime(t)}>
                {t} min
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <button type="button" className={`btn w-full text-left ${topic === "any" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTopic("any")}>
              Any topic
            </button>
            {topics().map((x) => (
              <button
                key={x.id}
                type="button"
                className={`btn w-full text-left justify-start ${topic === x.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setTopic(x.id)}
              >
                <div>
                  <div className="font-semibold">{x.label}</div>
                  <div className="text-xs text-muted-foreground">{x.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="card-pad">
          <div className="text-base font-medium mb-2">3) Scenario</div>
          <div className="text-sm text-muted-foreground mb-3">Choose one scenario (we'll keep it short).</div>
          <div className="space-y-2">
            {available.length === 0 ? (
              <div className="text-sm text-muted-foreground">No scenarios for this selection yet. (We can add more.)</div>
            ) : (
              available.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`btn w-full text-left justify-start ${scenarioId === s.id ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setScenarioId(s.id)}
                >
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      <span>{s.topic.replace("-", " ")}</span> • <span>{s.time} min</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {scenario ? (
        <div className="pt-6 border-t mt-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-lg font-medium">Scenario: {scenario.title}</div>
              <div className="text-sm text-muted-foreground">Answer the questions. Then reveal the key + ready-to-share outputs.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill muted>{scenario.role}</Pill>
              <Pill muted>{scenario.topic.replace("-", " ")}</Pill>
              <Pill>{scenario.time} min</Pill>
            </div>
          </div>

          <Card className="card-pad mb-4">
            <div className="text-sm font-medium mb-2"><strong>Situation</strong></div>
            <div className="text-sm mb-4">{scenario.situation}</div>
            <div className="text-sm font-medium mb-2"><strong>Boundaries</strong></div>
            <ul className="text-sm list-disc pl-5 space-y-1">
              {scenario.constraints.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </Card>

          <div className="space-y-4">
            {scenario.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                index={i}
                q={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                reveal={reveal}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={() => setReveal(true)}>Reveal answer key</Button>
            <Button variant="secondary" onClick={() => { setReveal(false); setAnswers({}); }}>
              Reset answers
            </Button>
          </div>

          {reveal ? (
            <div className="pt-6 border-t mt-6">
              <div className="text-lg font-medium mb-4">Answer key (inspection-safe)</div>
              <div className="grid md:grid-cols-2 gap-4">
                {scenario.answerKey.map((k) => (
                  <Card key={k.title} className="card-pad">
                    <div className="text-base font-medium mb-3">{k.title}</div>
                    <div className="text-sm font-medium mb-1">What to say</div>
                    <ul className="text-sm list-disc pl-5 space-y-1 mb-3">
                      {k.whatToSay.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                    <div className="text-sm font-medium mb-1">What to do</div>
                    <ul className="text-sm list-disc pl-5 space-y-1 mb-3">
                      {k.whatToDo.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                    <div className="text-sm font-medium mb-1">What to avoid</div>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {k.whatToAvoid.map((x) => <li key={x}>{x}</li>)}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          <div className="pt-6 border-t mt-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-lg font-medium">Ready-to-share outputs</div>
                <div className="text-sm text-muted-foreground">Template-generated (generic). Copy/paste into staff comms.</div>
              </div>
              <Pill muted>no child advice</Pill>
            </div>

            {draft ? (
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="card-pad">
                  <div className="text-base font-medium mb-3">{scenario.outputs.checklistTitle}</div>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    {draft.checklist.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </Card>
                <Card className="card-pad">
                  <div className="text-base font-medium mb-3">{scenario.outputs.briefingTitle}</div>
                  <ul className="text-sm list-disc pl-5 space-y-1 mb-4">
                    {draft.brief.map((x, idx) => <li key={`${idx}-${x}`}>{x}</li>)}
                  </ul>
                  {draft.parent.length > 0 ? (
                    <>
                      <div className="text-base font-medium mb-3">{scenario.outputs.parentTitle}</div>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        {draft.parent.map((x, idx) => <li key={`${idx}-${x}`}>{x}</li>)}
                      </ul>
                    </>
                  ) : null}
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}

