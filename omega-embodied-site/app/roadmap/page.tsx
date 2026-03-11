import Layout from "@/components/Layout";
import Section from "@/components/Section";

export default function RoadmapPage() {
  return (
    <Layout>
      <Section
        eyebrow="Roadmap"
        title="Three phases of the OMEGA platform"
        subtitle="From stable surfaces, to governed research swarms, to an embodied XR lab that produces proofs as a byproduct of play."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Phase 1
            </h3>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              Platform surfaces stable
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Stabilise the core surfaces: platform maps, verifier surfaces, and
              the unified reasoning and proof layers. Make the system legible
              to readers and builders without requiring internal context.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-600">
              <li>Lock in protocol and runtime shapes.</li>
              <li>Ship first proof bundles end-to-end.</li>
              <li>Expose a calm, documented surface for verification.</li>
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Phase 2
            </h3>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              Governed research swarm
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Run a swarm of agents and humans through the Treaty Runtime,
              treating research as governed compute. Experiments become
              verifiers; verifiers become part of the production trust fabric.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-600">
              <li>Stand up RLT-1.0 with treaty-backed experiments.</li>
              <li>Publish verifiers into the proof system.</li>
              <li>Close the loop from research to runtime decisions.</li>
            </ul>
          </article>

          <article className="flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Phase 3
            </h3>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              Embodied XR lab
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Bring the full stack into rooms, headsets, and robots. Teleop,
              simulation, haptics, and learning games all run under treaties,
              producing proofs as a side-effect of play and work.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-600">
              <li>Wire XR capture and haptics into TRT.</li>
              <li>Stabilise the digital twin pipeline.</li>
              <li>Ship trust lens and proof-based learning experiences.</li>
            </ul>
          </article>
        </div>
      </Section>

      <Section title="This week" subtitle="A small, concrete slice of the roadmap.">
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
          <p className="text-sm leading-relaxed text-zinc-700">
            This week:{" "}
            <span className="font-medium text-zinc-900">
              stabilise the reasoning and proof surfaces, unify UX across the
              main pages, and ship the first version of the platform map and
              OMEGA Sense
            </span>
            . The goal is to make OMEGA explorable end-to-end by a new reader
            without needing the backstory.
          </p>
        </div>
      </Section>
    </Layout>
  );
}

