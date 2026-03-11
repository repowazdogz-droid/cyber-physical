import Layout from "@/components/Layout";
import Section from "@/components/Section";

const PIPELINE_STAGES = [
  {
    label: "ANY INPUT",
    description:
      "OMEGA Sense accepts images, video, documents, voice, transcripts, spatial data, and sensor streams as first-class inputs. Everything enters through the same calm, typed envelope."
  },
  {
    label: "OBSERVE",
    description:
      "Raw inputs are parsed into observations: what is present, what is changing, and which signals matter. This is where noise is separated from structure without jumping straight to answers."
  },
  {
    label: "GOVERNANCE GATE",
    description:
      "Before deeper reasoning, inputs pass through governance: who is allowed to use which data, for what purpose, under which constraints. Unsafe or out-of-scope flows are stopped here."
  },
  {
    label: "REASONING SPINE",
    description:
      "A single reasoning spine runs across modalities, turning observations into hypotheses, checks, and decisions. The focus is on clarity of steps, not model spectacle."
  },
  {
    label: "TRACEABILITY CHAIN",
    description:
      "Every step is linked into a trace: which inputs were used, which rules fired, which alternatives were considered, and why a particular path was chosen."
  },
  {
    label: "STRUCTURED OUTPUT",
    description:
      "The result is a structured artifact — not just a response — that can be replayed, inspected, and reused by other parts of the OMEGA platform."
  }
];

const MODALITIES = [
  {
    title: "Visual (Image)",
    what: "Scenes, diagrams, interfaces, and artifacts converted into objects, relationships, and regions of interest.",
    why: "Governance defines what can be inferred from an image, how it can be stored, and where visual data is never allowed to flow."
  },
  {
    title: "Temporal (Video)",
    what: "Sequences of frames turned into timelines of actions, events, and transitions.",
    why: "Governance specifies which segments are sensitive, who may review them, and how long traces are retained."
  },
  {
    title: "Documents",
    what: "Reports, specs, contracts, and notes turned into entities, claims, constraints, and open questions.",
    why: "Governance ensures that classification, summarization, and extraction respect roles, confidentiality, and jurisdiction."
  },
  {
    title: "Voice",
    what: "Spoken commands, briefings, and discussions turned into transcripts, intentions, and commitments.",
    why: "Governance defines when voice counts as an instruction, what must be confirmed, and how mis-hearings are surfaced."
  },
  {
    title: "Conversation / Transcript",
    what: "Dialogue and chat history turned into positions, agreements, disagreements, and unresolved threads.",
    why: "Governance controls which parties may be analyzed, how consent is handled, and how power imbalances are made visible."
  },
  {
    title: "Sensor Fusion (Mocap / Wearables)",
    what: "Motion capture, haptics, and wearables turned into postures, gestures, and physiological states.",
    why: "Governance constrains which signals can drive systems, how safety thresholds are enforced, and how records are anonymized."
  },
  {
    title: "Spatial / XR",
    what: "Rooms, objects, and tools turned into spatial graphs and interaction zones.",
    why: "Governance defines which regions are safe, which are restricted, and how trust states are visualised in-headset."
  },
  {
    title: "Biometric",
    what: "Heart rate, gaze, and related signals turned into coarse states like load, focus, and fatigue — never raw identity.",
    why: "Governance sets strict limits on what can be inferred, how data is aggregated, and who may see any derivative."
  },
  {
    title: "Screen / Terminal",
    what: "Screens, logs, and terminals turned into workflows, commands, and effects.",
    why: "Governance ensures that automation and assistance respect boundaries: which systems can be touched, and under whose authority."
  }
];

export default function SensePage() {
  return (
    <Layout>
      <Section
        eyebrow="Sense"
        title="OMEGA Sense"
        subtitle="One reasoning engine. Any input. Structured, constrained, explainable output."
        as="h1"
      >
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
          <p>
            OMEGA Sense is a multimodal reasoning layer that accepts visual,
            voice, document, spatial, sensor, and interaction input, runs
            structured reasoning with governance constraints, and emits
            traceable artifacts that can be replayed, verified, and understood.
          </p>
        </div>
      </Section>

      <Section
        eyebrow="Pipeline"
        title="From any input to a verifiable artifact"
        subtitle="A single reasoning spine that treats all modalities as first-class, while keeping the path from input to artifact explainable."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)]">
          <div className="space-y-2 rounded-2xl border border-zinc-200/60 bg-white p-4 text-sm text-zinc-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              OMEGA Sense pipeline
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium text-zinc-900">ANY INPUT</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium text-zinc-900">OBSERVE</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium text-zinc-900">GOVERNANCE GATE</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium text-zinc-900">REASONING SPINE</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium text-zinc-900">TRACEABILITY CHAIN</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium text-zinc-900">STRUCTURED OUTPUT</p>
            </div>
          </div>
          <div className="space-y-3">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.label}
                className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {stage.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Modalities"
        title="Input modalities, one engine"
        subtitle="OMEGA Sense treats each modality as a source of structured signals, not as a special-case feature area."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODALITIES.map((modality) => (
            <article
              key={modality.title}
              className="flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-4 text-sm shadow-sm"
            >
              <h3 className="text-sm font-semibold text-zinc-900">
                {modality.title}
              </h3>
              <dl className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    What gets structured
                  </dt>
                  <dd className="mt-1">{modality.what}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Why governance matters
                  </dt>
                  <dd className="mt-1">{modality.why}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Embodiment"
        title="Embodied & spatial intelligence"
        subtitle="When reasoning is grounded in rooms, devices, and bodies, it must be felt as well as read."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 text-sm leading-relaxed text-zinc-600">
            <p>
              Vision Pro and Quest 3 become canvases where governance and
              reasoning are visible in the room: zones of permission and
              constraint, live trust overlays, and explanations anchored to
              tools and agents instead of buried in logs.
            </p>
            <p>
              Motion capture and haptics make constraints physical. When a
              treaty disallows a move, you feel the edge of the system through
              the suit or vest, turning abstract safety policies into embodied
              feedback.
            </p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-zinc-600">
            <p>
              Proof objects become inspectable artifacts in XR: you can pick up
              a proof, see its lineage, and understand which inputs and
              decisions it depends on. Spatial knowledge anchoring ties these
              artifacts back to rooms, tools, and teams.
            </p>
            <p>
              Social, multiplayer, governed worlds let groups inhabit the same
              reasoning space. Players see how treaties, proofs, and constraints
              shape their options in real time, rather than reading about
              governance after the fact.
            </p>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Why this matters"
        title="Structured, inspectable reasoning"
      >
        <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
          <p>
            This is not about producing more AI responses. It is about ensuring
            that reasoning itself is structured, constrained, and inspectable.
          </p>
          <p>
            OMEGA Sense focuses on artifacts: traces, proofs, and records that
            can be replayed and understood, not just consumed once and lost.
          </p>
          <p>
            The aim is intelligence that can operate safely in physical and
            social space — where actions, explanations, and responsibilities are
            clear to everyone involved.
          </p>
        </div>
      </Section>
    </Layout>
  );
}

