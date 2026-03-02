import { useEffect } from "react";
import type {
  OrientationState,
  Assumption,
  Unknown,
  JudgmentType,
} from "../types/orientation";
import { createId } from "../utils/id";
import { Card, Field, Input, Textarea, Select, Button, Empty } from "./ui";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export function PrimitiveEditor({
  state,
  setState,
  onBeforeChange,
  onUndo,
  focusSection = "all",
}: {
  state: OrientationState;
  setState: Setter<OrientationState>;
  onBeforeChange?: (prevState: OrientationState) => void;
  onUndo?: () => void;
  focusSection?: "all" | "models" | "rest";
}) {
  const touch = () => {
    if (onBeforeChange) onBeforeChange(state);
    setState((s) => ({ ...s, updatedAt: Date.now() }));
  };

  // Keyboard shortcuts: Cmd/Ctrl+Z for undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo]);

  const updateState = (updater: (s: OrientationState) => OrientationState) => {
    if (onBeforeChange) {
      onBeforeChange(state);
    }
    setState(updater);
  };

  const showModels = focusSection === "all" || focusSection === "models";
  const showRest = focusSection === "all" || focusSection === "rest";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {showModels ? <ModelsCard state={state} setState={updateState} /> : null}

      {showRest ? (
        <>
          <AssumptionsCard state={state} setState={updateState} />

          <DisagreementsCard state={state} setState={updateState} />

          <UnknownsCard state={state} setState={updateState} />

          <JudgmentsCard
            selected={state.judgments}
            onChange={(next) => {
              updateState((s) => ({ ...s, judgments: next, updatedAt: Date.now() }));
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              variant="ghost"
              onClick={() => {
                // gentle normalize: trim empty titles, etc.
                updateState((s) => ({
                  ...s,
                  models: s.models.map((m) => ({
                    ...m,
                    name: m.name.trim(),
                    claim: m.claim.trim(),
                    scope: m.scope.trim(),
                  })),
                  assumptions: s.assumptions.map((a) => ({
                    ...a,
                    text: a.text.trim(),
                    owner: a.owner?.trim() || undefined,
                  })),
                  disagreements: s.disagreements.map((d) => ({
                    ...d,
                    topic: d.topic.trim(),
                    parties: d.parties?.trim() || undefined,
                    whatWouldChangeMind: d.whatWouldChangeMind?.trim() || undefined,
                  })),
                  unknowns: s.unknowns.map((u) => ({
                    ...u,
                    question: u.question.trim(),
                    owner: u.owner?.trim() || undefined,
                  })),
                  updatedAt: Date.now(),
                }));
              }}
            >
              Clean up text
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                const payload = JSON.stringify(state, null, 2);
                navigator.clipboard?.writeText(payload);
                touch();
              }}
            >
              Copy state as JSON
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ModelsCard({
  state,
  setState,
}: {
  state: OrientationState;
  setState: (updater: (s: OrientationState) => OrientationState) => void;
}) {
  return (
    <Card
      title="Models"
      subtitle="Different valid lenses on the same situation. Capture the claim + what it covers."
      right={
        <Button
          onClick={() =>
            setState((s) => ({
              ...s,
              models: [
                ...s.models,
                { id: createId("model"), name: "", claim: "", scope: "" },
              ],
              updatedAt: Date.now(),
            }))
          }
        >
          Add model
        </Button>
      }
    >
      {state.models.length === 0 ? <Empty>No models captured yet.</Empty> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {state.models.map((m, idx) => (
          <div key={m.id} style={rowBox}>
            <div style={rowTop}>
              <div style={rowTitle}>Model {idx + 1}</div>
              <Button
                variant="ghost"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    models: s.models.filter((x) => x.id !== m.id),
                    updatedAt: Date.now(),
                  }))
                }
              >
                Remove
              </Button>
            </div>

            <Field label="Name" hint="e.g., Ops view / Safety view / Finance view">
              <Input
                value={m.name}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    models: s.models.map((x) => (x.id === m.id ? { ...x, name: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="Ops view"
              />
            </Field>

            <Field label="Claim" hint="What this model says is happening.">
              <Textarea
                value={m.claim}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    models: s.models.map((x) => (x.id === m.id ? { ...x, claim: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="Describe the situation through this lens."
              />
            </Field>

            <Field label="Scope" hint="What it covers / what it ignores.">
              <Textarea
                value={m.scope}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    models: s.models.map((x) => (x.id === m.id ? { ...x, scope: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="Covers X. Ignores Y. Assumes Z."
              />
            </Field>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AssumptionsCard({
  state,
  setState,
}: {
  state: OrientationState;
  setState: (updater: (s: OrientationState) => OrientationState) => void;
}) {
  return (
    <Card
      title="Assumptions"
      subtitle="Make implicit assumptions explicit. Mark whether they're given, contested, or unknown."
      right={
        <Button
          onClick={() =>
            setState((s) => ({
              ...s,
              assumptions: [
                ...s.assumptions,
                { id: createId("assumption"), text: "", status: "given", owner: "" },
              ],
              updatedAt: Date.now(),
            }))
          }
        >
          Add assumption
        </Button>
      }
    >
      {state.assumptions.length === 0 ? <Empty>No assumptions captured yet.</Empty> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {state.assumptions.map((a, idx) => (
          <div key={a.id} style={rowBox}>
            <div style={rowTop}>
              <div style={rowTitle}>Assumption {idx + 1}</div>
              <Button
                variant="ghost"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    assumptions: s.assumptions.filter((x) => x.id !== a.id),
                    updatedAt: Date.now(),
                  }))
                }
              >
                Remove
              </Button>
            </div>

            <Field label="Assumption statement" hint="Write it as a plain claim.">
              <Textarea
                value={a.text}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    assumptions: s.assumptions.map((x) => (x.id === a.id ? { ...x, text: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="e.g., Demand will spike after 6pm."
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Status" hint="Given / contested / unknown">
                <Select
                  value={a.status}
                  onChange={(v) => {
                    setState((s) => ({
                      ...s,
                      assumptions: s.assumptions.map((x) => (x.id === a.id ? { ...x, status: v as Assumption["status"] } : x)),
                      updatedAt: Date.now(),
                    }));
                  }}
                >
                  <option value="given">given</option>
                  <option value="contested">contested</option>
                  <option value="unknown">unknown</option>
                </Select>
              </Field>

              <Field label="Owner (role/team)" hint="Optional. Who could validate?">
                <Input
                  value={a.owner || ""}
                  onChange={(v) => {
                    setState((s) => ({
                      ...s,
                      assumptions: s.assumptions.map((x) => (x.id === a.id ? { ...x, owner: v } : x)),
                      updatedAt: Date.now(),
                    }));
                  }}
                  placeholder="e.g., Site ops lead"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DisagreementsCard({
  state,
  setState,
}: {
  state: OrientationState;
  setState: (updater: (s: OrientationState) => OrientationState) => void;
}) {
  return (
    <Card
      title="Disagreements"
      subtitle="Where models conflict. Capture what is disputed and what would resolve it."
      right={
        <Button
          onClick={() =>
            setState((s) => ({
              ...s,
              disagreements: [
                ...s.disagreements,
                { id: createId("disagreement"), topic: "", parties: "", whatWouldChangeMind: "" },
              ],
              updatedAt: Date.now(),
            }))
          }
        >
          Add disagreement
        </Button>
      }
    >
      {state.disagreements.length === 0 ? <Empty>No disagreements captured yet.</Empty> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {state.disagreements.map((d, idx) => (
          <div key={d.id} style={rowBox}>
            <div style={rowTop}>
              <div style={rowTitle}>Disagreement {idx + 1}</div>
              <Button
                variant="ghost"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    disagreements: s.disagreements.filter((x) => x.id !== d.id),
                    updatedAt: Date.now(),
                  }))
                }
              >
                Remove
              </Button>
            </div>

            <Field label="Topic" hint="What is being disputed?">
              <Textarea
                value={d.topic}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    disagreements: s.disagreements.map((x) => (x.id === d.id ? { ...x, topic: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="e.g., Whether the bottleneck is triage capacity or inpatient bed flow."
              />
            </Field>

            <Field label="Parties (roles/teams)" hint="Optional. Keep it role-based.">
              <Input
                value={d.parties || ""}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    disagreements: s.disagreements.map((x) => (x.id === d.id ? { ...x, parties: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="e.g., ED ops vs inpatient flow"
              />
            </Field>

            <Field label="What would change minds?" hint="Evidence, observation, test, or threshold.">
              <Textarea
                value={d.whatWouldChangeMind || ""}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    disagreements: s.disagreements.map((x) =>
                      x.id === d.id ? { ...x, whatWouldChangeMind: v } : x
                    ),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="e.g., A one-week time series of arrival-to-clinician vs bed allocation delays."
              />
            </Field>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UnknownsCard({
  state,
  setState,
}: {
  state: OrientationState;
  setState: (updater: (s: OrientationState) => OrientationState) => void;
}) {
  return (
    <Card
      title="Unknowns"
      subtitle="What you cannot responsibly assume yet. Track impact + horizon so judgment stays honest."
      right={
        <Button
          onClick={() =>
            setState((s) => ({
              ...s,
              unknowns: [
                ...s.unknowns,
                {
                  id: createId("unknown"),
                  question: "",
                  impact: "medium",
                  horizon: "unknown",
                  owner: "",
                },
              ],
              updatedAt: Date.now(),
            }))
          }
        >
          Add unknown
        </Button>
      }
    >
      {state.unknowns.length === 0 ? <Empty>No unknowns captured yet.</Empty> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {state.unknowns.map((u, idx) => (
          <div key={u.id} style={rowBox}>
            <div style={rowTop}>
              <div style={rowTitle}>Unknown {idx + 1}</div>
              <Button
                variant="ghost"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    unknowns: s.unknowns.filter((x) => x.id !== u.id),
                    updatedAt: Date.now(),
                  }))
                }
              >
                Remove
              </Button>
            </div>

            <Field label="Unknown question" hint="Phrase as a question.">
              <Textarea
                value={u.question}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    unknowns: s.unknowns.map((x) => (x.id === u.id ? { ...x, question: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="e.g., Will downstream capacity tighten after 8pm?"
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Impact" hint="How much it matters if wrong.">
                <Select
                  value={u.impact}
                  onChange={(v) => {
                    setState((s) => ({
                      ...s,
                      unknowns: s.unknowns.map((x) => (x.id === u.id ? { ...x, impact: v as Unknown["impact"] } : x)),
                      updatedAt: Date.now(),
                    }));
                  }}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </Select>
              </Field>

              <Field label="Horizon" hint="When might this become knowable?">
                <Select
                  value={u.horizon || "unknown"}
                  onChange={(v) => {
                    setState((s) => ({
                      ...s,
                      unknowns: s.unknowns.map((x) => (x.id === u.id ? { ...x, horizon: v as NonNullable<Unknown["horizon"]> } : x)),
                      updatedAt: Date.now(),
                    }));
                  }}
                >
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                  <option value="unknown">unknown</option>
                </Select>
              </Field>
            </div>

            <Field label="Owner (role/team)" hint="Optional. Who can reduce this unknown?">
              <Input
                value={u.owner || ""}
                onChange={(v) => {
                  setState((s) => ({
                    ...s,
                    unknowns: s.unknowns.map((x) => (x.id === u.id ? { ...x, owner: v } : x)),
                    updatedAt: Date.now(),
                  }));
                }}
                placeholder="e.g., Ops analyst / duty manager"
              />
            </Field>
          </div>
        ))}
      </div>
    </Card>
  );
}

function JudgmentsCard({
  selected,
  onChange,
}: {
  selected: JudgmentType[];
  onChange: (next: JudgmentType[]) => void;
}) {
  const all: JudgmentType[] = [
    "definition",
    "measurement",
    "threshold",
    "tradeoff",
    "authority",
    "timing",
    "values",
  ];

  return (
    <Card
      title="What kind of question is this?"
      subtitle="Mark what kind of judgment is actually needed to move forward."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
        {all.map((jt) => {
          const checked = selected.includes(jt);
          return (
            <label
              key={jt}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: 10,
                padding: "10px 10px",
                background: checked ? "rgba(17,24,39,0.04)" : "#fff",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  e.target.checked
                    ? onChange([...selected, jt])
                    : onChange(selected.filter((x) => x !== jt))
                }
              />
              <span style={{ fontSize: 13, fontWeight: 650, color: "#111" }}>{jt}</span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

const rowBox: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 12,
  padding: 12,
  background: "rgba(255,255,255,0.92)",
};

const rowTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const rowTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 750,
  color: "#111",
};

