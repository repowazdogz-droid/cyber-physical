import Layout from "@/components/Layout";
import Section from "@/components/Section";
import Link from "next/link";
import PlatformMap from "@/components/PlatformMap";

export default function Page() {
  return (
    <Layout>
      <Section
        eyebrow="OMEGA"
        title="Embodied Intelligence Platform"
        subtitle="Protocols, runtimes, proofs, and embodiment — one coherent system for governed, verifiable action in the real world."
        as="h1"
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6 text-center">
          <p className="text-sm leading-relaxed text-zinc-600 sm:text-base">
            Embodied intelligence matters because decisions do not stay in
            models — they move bodies, tools, and rooms. Governance, proof, and
            spatial systems keep those decisions legible instead of opaque.
            OMEGA exists to make intelligent systems inspectable, governed, and
            shareable across code, labs, and robots.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/platform"
              className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-50 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              Explore the platform
            </Link>
            <Link
              href="/research"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200/80 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              Read the research
            </Link>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Why"
        title="Intelligence should be inspectable"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">
                Opaque AI → risk
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                When decisions are hidden inside models, it is hard to see who
                was allowed to act, on what basis, and under which constraints.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">
                Simulation without proof → fragility
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                Simulations that cannot emit verifiable traces are hard to
                trust, compare, or replay when something subtle goes wrong.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">
                Embodiment without governance → harm
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                When bodies, rooms, or robots move without governed action,
                small mistakes can propagate quickly into real-world harm.
              </p>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            OMEGA integrates{" "}
            <span className="font-medium text-zinc-900">governed action</span>,{" "}
            <span className="font-medium text-zinc-900">reasoned decision</span>
            , and{" "}
            <span className="font-medium text-zinc-900">verifiable trace</span>{" "}
            into embodied systems, so that intelligence can be inspected,
            constrained, and improved without losing contact with the room.
          </p>
        </div>
      </Section>

      <Section
        title="Three primitives"
        subtitle="The platform is organised around three primitives that appear everywhere: how actions are governed, how decisions are reasoned, and how traces are recorded."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              Governed action
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              Actions are routed through explicit treaties, roles, and
              constraints so you can see who is allowed to move what, when.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              Reasoned decision
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              Decisions carry a chain of reasoning — observations, assumptions,
              and trade-offs — instead of a single opaque verdict.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              Verifiable trace
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              Histories are recorded as hash-linked traces and artifacts,
              so others can replay, inspect, and extend what happened.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="OMEGA Sense"
        subtitle="An engine-first layer for multimodal, governed reasoning."
      >
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
              Multimodal governed reasoning — image, voice, document, spatial,
              and sensor input flowing through a single structured engine.
            </p>
            <Link
              href="/sense"
              className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              Explore the engine →
            </Link>
          </div>
        </div>
      </Section>

      <Section
        title="Platform map"
        subtitle="A calm, architectural view of the whole stack: protocols, runtimes, proofs, XR, simulation, and agents."
      >
        <div className="space-y-4 rounded-2xl border border-zinc-200/60 bg-white px-5 py-4 shadow-sm">
          <PlatformMap variant="preview" />
          <div className="mt-3 flex justify-end">
            <Link
              href="/platform"
              className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[1px] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              Open full map →
            </Link>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
