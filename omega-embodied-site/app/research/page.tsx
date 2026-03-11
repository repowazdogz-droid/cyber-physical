import Layout from "@/components/Layout";
import Section from "@/components/Section";

export default function ResearchPage() {
  return (
    <Layout>
      <Section
        eyebrow="Research"
        title="Research Lab, Treaty Runtime, and irreducibility"
        subtitle="How experiments, runtimes, and primitives fit together — and how research outputs become proofs and training data."
      >
        <div className="space-y-6 text-sm leading-relaxed text-zinc-600 sm:text-base">
          <section className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              System map
            </p>
            <div className="mt-3 space-y-1.5 text-sm text-zinc-800">
              <p className="font-medium">Research Lab (RLT)</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium">Treaty Runtime (TRT)</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium">Proof System</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium">Embodied XR / Robotics</p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              RLT vs TRT
            </h3>
            <p>
              The{" "}
              <span className="font-medium text-zinc-900">
                Research Lab (RLT)
              </span>{" "}
              is where experiments live: prompts, models, simulations, and
              evaluation pipelines. It is intentionally exploratory, but still
              governed — experiments carry metadata about who ran them, under
              which treaty, and with which constraints.
            </p>
            <p>
              The{" "}
              <span className="font-medium text-zinc-900">
                Treaty Runtime (TRT)
              </span>{" "}
              is where treaties run in production. It focuses on stability,
              invariants, and legibility under load. Where RLT is about asking
              &quot;what if?&quot;, TRT is about enforcing &quot;what must
              always be true?&quot;.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Verifier nodes
            </h3>
            <p>
              A <span className="font-medium text-zinc-900">verifier node</span>{" "}
              is a unit that can accept an artefact — a proof bundle, a trace,
              a treaty, a model card — and return a structured verdict. It
              does not need to be complex; it needs to be{" "}
              <span className="font-medium text-zinc-900">
                explainable and composable
              </span>
              .
            </p>
            <p>
              In OMEGA, verifier nodes form a small graph behind platform
              surfaces. RLT can publish new verifiers, TRT can depend on them,
              and the proof system can show exactly which nodes were consulted
              for each decision.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Irreducibility and the three primitives
            </h3>
            <p>
              The{" "}
              <span className="font-medium text-zinc-900">
                irreducibility conjecture
              </span>{" "}
              proposes that there are three primitives you cannot safely remove
              from embodied intelligence without losing trust:
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              <li>
                <span className="font-medium text-zinc-900">
                  Governed action
                </span>{" "}
                — actions are constrained and routed through explicit treaties,
                roles, and limits.
              </li>
              <li>
                <span className="font-medium text-zinc-900">
                  Reasoned decision
                </span>{" "}
                — decisions carry a visible chain of reasoning rather than a
                single opaque verdict.
              </li>
              <li>
                <span className="font-medium text-zinc-900">
                  Verifiable trace
                </span>{" "}
                — histories are recorded as traces that can be replayed,
                checked, and disputed.
              </li>
            </ul>
            <p>
              Much of the research agenda is about testing this conjecture:
              finding systems that appear to work without one of the
              primitives, and then understanding where the failure modes hide.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              From research outputs to proofs and training data
            </h3>
            <p>
              In RLT, experiments are treated as first-class objects: they have
              inputs, environments, treaties, and evaluation criteria. When an
              experiment survives scrutiny, it can be promoted into a{" "}
              <span className="font-medium text-zinc-900">
                proof bundle
              </span>{" "}
              and, optionally, into{" "}
              <span className="font-medium text-zinc-900">
                training data
              </span>
              .
            </p>
            <p>
              Proof bundles move into the proof system and verifier graph,
              where they can be consumed by runtimes or external integrations.
              Training data derived from these experiments is tagged with the
              same governance context, so models trained on it inherit a
              traceable lineage instead of an opaque corpus.
            </p>
            <p>
              The long-term goal is simple: when you deploy an agent, you can
              ask, <em>&quot;Which governed actions, reasoned decisions, and
              verifiable traces is this behaviour resting on?&quot;</em> — and
              get a calm, concrete answer.
            </p>
          </section>
        </div>
      </Section>
    </Layout>
  );
}

