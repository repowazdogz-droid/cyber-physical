import Layout from "@/components/Layout";
import Section from "@/components/Section";

interface ExperienceTrack {
  id: string;
  title: string;
  what: string;
  fun: string;
  useful: string;
  proof?: string;
}

const TRACKS: ExperienceTrack[] = [
  {
    id: "experiences-proof-games",
    title: "Proof-based learning games",
    what:
      "Games that teach governance, traceability, and reasoning by making proof objects the thing you are optimising, not just score.",
    fun:
      "You play with treaties, constraints, and agents the way you would play with resources in a strategy game — except the moves are legible afterwards.",
    useful:
      "Each run emits a proof bundle that captures the path you took, the constraints you navigated, and the trade-offs you explored.",
    proof:
      "Game sessions emit proof objects that can be replayed, compared, and reused in research."
  },
  {
    id: "experiences-governed-teleop",
    title: "XR teleoperation as a governed experience",
    what:
      "Teleoperation sessions where every move is routed through treaties and constraints, and the state of the system is felt as much as it is seen.",
    fun:
      "You feel the edges of the system — which moves are encouraged, which are blocked, and why — through haptics, overlays, and motion.",
    useful:
      "Teleop becomes a data source for safety, coordination, and training, rather than an opaque control channel.",
    proof:
      "Teleop logs ship as proof objects with per-move justifications linked back to treaties and verifiers."
  },
  {
    id: "experiences-governance-sandbox",
    title: "Social multiplayer governance sandbox",
    what:
      "A multiplayer space where teams negotiate treaties, allocate agency, and design constraints together, with immediate feedback.",
    fun:
      "It feels like a cooperative board game: you design rules, test them against scenarios, and discover unexpected behaviours.",
    useful:
      "It surfaces which governance patterns actually hold up under pressure, and which collapse — before you deploy them anywhere serious.",
    proof:
      "Sessions yield proofs of which treaties were proposed, adopted, stressed, and revised over time."
  },
  {
    id: "experiences-trust-lens",
    title: "Spatial “trust lens”",
    what:
      "A spatial overlay that shows what the system currently trusts, doubts, or blocks across tools, agents, and environments.",
    fun:
      "You walk through a room or scenario and see its trust state the way you might see lighting or acoustics.",
    useful:
      "It turns invisible assumptions into legible structure, making it easier to debug, explain, and improve the system.",
    proof:
      "Captured sessions link trust overlays to underlying proofs and runtime decisions."
  },
  {
    id: "experiences-creative-studio",
    title: "Creative studio mode",
    what:
      "A studio surface for building scenarios, designing treaties, wiring agents, and exporting proof bundles to share.",
    fun:
      "It feels like a design tool instead of a config file: you sketch behaviours, test them, and refine them visually.",
    useful:
      "The studio becomes the bridge between research, platform, and experiences — where new scenarios are born and turned into reusable patterns.",
    proof:
      "Each scenario can export a proof-backed bundle describing its assumptions, constraints, and performance."
  }
];

export default function ExperiencesPage() {
  return (
    <Layout>
      <Section
        eyebrow="Experiences"
        title="Fun and play, as primary surfaces"
        subtitle="Experiences are not side quests. They are how people feel the treaties, proofs, and constraints that power OMEGA."
      >
        <div className="max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          <p>
            These tracks are deliberately playful, but each is tied back to a
            proof object or runtime surface. The goal is to make{" "}
            <span className="font-medium text-zinc-900">
              governance, traceability, and embodiment
            </span>{" "}
            something you can feel and iterate on, not just read in a spec.
          </p>
        </div>
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        {TRACKS.map((track) => (
          <article
            key={track.id}
            className="flex flex-col rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
          >
            <h3 className="text-sm font-semibold text-zinc-900">
              {track.title}
            </h3>
            <dl className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-600">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  What it is
                </dt>
                <dd className="mt-1">{track.what}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Why it&apos;s fun
                </dt>
                <dd className="mt-1">{track.fun}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Why it&apos;s useful
                </dt>
                <dd className="mt-1">{track.useful}</dd>
              </div>
              {track.proof && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Proof object
                  </dt>
                  <dd className="mt-1">{track.proof}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
      </div>
    </Layout>
  );
}

