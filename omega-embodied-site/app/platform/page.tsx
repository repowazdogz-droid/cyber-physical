import Layout from "@/components/Layout";
import Section from "@/components/Section";
import PlatformMap from "@/components/PlatformMap";

export default function PlatformPage() {
  return (
    <Layout>
      <Section
        eyebrow="Platform"
        title="The whole system, as a map"
        subtitle="Protocols, runtimes, proofs, embodiment, XR, and simulation — one coherent platform instead of a stack of disconnected tools."
      >
        <div className="max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          <p>
            This page is the architectural map of OMEGA. Each node is a
            concrete capability: a runtime, an integration, a research surface,
            or an experience. The goal is to make the system explorable without
            hiding the technical reality underneath.
          </p>

          <div className="mt-8 inline-flex flex-col rounded-2xl border border-zinc-200/60 bg-white px-4 py-4 text-sm text-zinc-800 shadow-sm sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Three primitives
            </p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="font-medium text-zinc-900">Governed action</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium text-zinc-900">Reasoned decision</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                ↓
              </p>
              <p className="font-medium text-zinc-900">Verifiable trace</p>
            </div>
          </div>
        </div>
      </Section>

      <PlatformMap />
    </Layout>
  );
}

