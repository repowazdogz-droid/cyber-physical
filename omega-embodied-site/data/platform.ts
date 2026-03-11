export type PlatformNodeStatus =
  | "Live"
  | "Built"
  | "Installed"
  | "Planned"
  | "Exploring";

export interface PlatformLink {
  label: string;
  href: string;
}

export interface PlatformNode {
  id: string;
  title: string;
  tagline: string;
  description: string;
  status: PlatformNodeStatus;
  proof?: string;
  connections: string[];
  actions: string[];
  links?: PlatformLink[];
}

export interface PlatformCategory {
  id: string;
  title: string;
  description: string;
  nodes: PlatformNode[];
}

export interface PlatformData {
  categories: PlatformCategory[];
}

export const PLATFORM: PlatformData = {
  categories: [
    {
      id: "core",
      title: "Core Protocols & Runtimes",
      description:
        "The base layer: protocols, runtimes, research lab, and proof system that give OMEGA its verifiability and structure.",
      nodes: [
        {
          id: "core-omega-protocol",
          title: "OMEGA Protocol",
          tagline: "Eight composable protocols for governed intelligence.",
          description:
            "A family of eight protocols that describe how agents, humans, and environments negotiate, commit, act, and verify. Each protocol is small and composable, designed to be explainable and traceable under load.",
          status: "Built",
          proof:
            "Protocol-level invariants and treaty test suites, plus example transcripts that can be replayed.",
          connections: [
            "core-treaty-runtime",
            "core-research-lab",
            "core-proof-system"
          ],
          actions: [
            "Open protocol overview",
            "Browse protocol transcripts",
            "Inspect invariants"
          ],
          links: [
            { label: "Protocol spec (draft)", href: "#" },
            { label: "Example treaties", href: "#" }
          ]
        },
        {
          id: "core-omega-sense",
          title: "OMEGA Sense",
          tagline: "Multimodal input layer powering embodied reasoning.",
          description:
            "OMEGA Sense is the engine that accepts visual, voice, document, spatial, and sensor input and routes it through a single governed reasoning spine. It turns raw signals into structured observations, decisions, and artifacts that the rest of the platform can trust.",
          status: "Exploring",
          proof:
            "Sense-level traces linking inputs, governance decisions, reasoning graphs, and emitted artifacts.",
          connections: [
            "core-treaty-runtime",
            "core-proof-system",
            "core-research-lab",
            "xr-rokoko",
            "xr-vision-pro",
            "xr-governed-teleop",
            "sim-omniverse-isaac",
            "agents-local-stack",
            "sim-safety-playback"
          ],
          actions: [
            "Review engine design sketch",
            "Map a new modality into Sense",
            "Trace an input-to-artifact path"
          ],
          links: [{ label: "Sense overview (draft)", href: "#" }]
        },
        {
          id: "core-treaty-runtime",
          title: "Treaty Runtime (TRT-1.0)",
          tagline: "Runtime for governed multi-agent treaties.",
          description:
            "TRT-1.0 is the runtime where treaties become live. It enforces constraints, logs decisions, and routes actions through verifiable channels. Every action is contextualized by which treaty and which clause allowed it.",
          status: "Live",
          proof:
            "Runtime traces, constraint logs, and replayable action histories.",
          connections: [
            "core-omega-protocol",
            "core-proof-system",
            "core-omega-sense",
            "agents-local-stack"
          ],
          actions: [
            "Inspect treaty execution trace",
            "Review constraint violations",
            "Simulate a new treaty"
          ],
          links: [{ label: "Runtime notes", href: "#" }]
        },
        {
          id: "core-research-lab",
          title: "Research Lab (RLT-1.0)",
          tagline: "Governed experimentation pipeline.",
          description:
            "RLT-1.0 is a governed research environment where experiments, prompts, and models run under the same treaty logic as production. It turns exploratory work into structured evidence and reusable proof objects.",
          status: "Live",
          proof:
            "Experiment manifests, evaluation reports, and attached proof bundles.",
          connections: [
            "core-treaty-runtime",
            "core-proof-system",
            "core-omega-sense",
            "agents-local-stack"
          ],
          actions: [
            "Browse recent experiments",
            "Open evaluation report",
            "Promote experiment to proof"
          ],
          links: [{ label: "RLT overview", href: "#" }]
        },
        {
          id: "core-proof-system",
          title: "Proof System",
          tagline: "TRT + RLT bundled into portable proof objects.",
          description:
            "The proof system bundles runtime traces, research artefacts, and constraints into portable objects. These proofs can be shipped, inspected, replayed, and composed into higher-level guarantees.",
          status: "Built",
          proof:
            "Signed proof bundles with attached constraints, inputs, and outcomes.",
          connections: [
            "core-treaty-runtime",
            "core-research-lab",
            "core-unified-verifier",
            "core-omega-sense"
          ],
          actions: [
            "Inspect a proof bundle",
            "Trace constraint lineage",
            "Export proof for external verifier"
          ],
          links: [{ label: "Proof bundle schema", href: "#" }]
        },
        {
          id: "core-unified-verifier",
          title: "Unified Verifier Node",
          tagline: "Single endpoint to verify actions and artefacts.",
          description:
            "A unified verifier node exposes a single, composable verification surface. Downstream, it can call into many different verifiers, but upstream it stays simple and explainable: send object, get structured verdict.",
          status: "Built",
          proof:
            "Verifier call graphs, verdict logs, and consistency checks against proofs.",
          connections: [
            "core-proof-system",
            "core-omega-sense",
            "agents-local-stack"
          ],
          actions: [
            "Send a sample verification request",
            "Inspect a verifier call graph",
            "Add a new verifier backend"
          ],
          links: [{ label: "Verifier surface sketch", href: "#" }]
        },
        {
          id: "core-clearpath-sdk",
          title: "Clearpath SDK",
          tagline: "Developer kit for governed, provable flows.",
          description:
            "The Clearpath SDK is how developers talk to OMEGA. It wraps treaties, proofs, and verifiers into a calm, typed interface so that building governed applications feels straightforward instead of fragile.",
          status: "Planned",
          proof:
            "Example flows and integration tests that show guarantees preserved end-to-end.",
          connections: [
            "core-omega-protocol",
            "core-treaty-runtime",
            "core-unified-verifier"
          ],
          actions: [
            "Review SDK design notes",
            "Sketch a new integration",
            "Map an existing app to Clearpath"
          ],
          links: [{ label: "SDK design doc (draft)", href: "#" }]
        },
        {
          id: "core-irreducibility",
          title: "Irreducibility Conjecture (3 Primitives)",
          tagline: "Minimal primitives for trustworthy embodied agents.",
          description:
            "The irreducibility conjecture suggests there are three primitives you cannot remove if you want trustworthy embodied intelligence: governed action, verifiable trace, and embodied constraint. Everything else composes on top.",
          status: "Exploring",
          proof:
            "Thought experiments, formal notes, and counterexamples that survive scrutiny.",
          connections: [
            "core-omega-protocol",
            "core-research-lab",
            "xr-trust-lens"
          ],
          actions: [
            "Read the primitives note",
            "Test a counterexample",
            "Map a system onto the primitives"
          ],
          links: [{ label: "Irreducibility note", href: "#" }]
        }
      ]
    },
    {
      id: "embodiment-xr",
      title: "Embodiment & XR",
      description:
        "How OMEGA touches bodies, rooms, headsets, and haptics — where treaties become felt instead of abstract.",
      nodes: [
        {
          id: "xr-rokoko",
          title: "Rokoko Smartsuit + Gloves + Headrig",
          tagline: "Full-body capture as a governed signal.",
          description:
            "Rokoko hardware streams pose, gesture, and intent into the platform. Instead of being raw telemetry, these signals are framed by treaties: who is allowed to move what, when, and under which constraints.",
          status: "Installed",
          proof:
            "Recorded motion traces linked to constraint sets and downstream effects.",
          connections: [
            "sim-omniverse-isaac",
            "xr-governed-teleop",
            "xr-proof-games",
            "core-omega-sense"
          ],
          actions: [
            "Replay a captured session",
            "Overlay treaty constraints on motion",
            "Route capture into simulation"
          ],
          links: [{ label: "Rokoko integration notes", href: "#" }]
        },
        {
          id: "xr-vive",
          title: "Vive Trackers + Base Stations",
          tagline: "High-fidelity tracking for lab-scale embodiment.",
          description:
            "Vive trackers anchor bodies, tools, and props into a shared spatial frame. Within OMEGA, these anchors become governed: what can this tracker move, and what proof do we require before movement is allowed?",
          status: "Installed",
          proof:
            "Spatial traces and collision histories annotated with treaty context.",
          connections: [
            "sim-omniverse-isaac",
            "xr-governed-teleop",
            "xr-trust-lens"
          ],
          actions: [
            "Inspect a spatial trace",
            "Bind a tracker to a treaty role",
            "Simulate a constraint breach"
          ],
          links: [{ label: "Tracking rig diagram", href: "#" }]
        },
        {
          id: "xr-bhaptics",
          title: "bHaptics Vest",
          tagline: "Haptics that carry governance signals.",
          description:
            "The bHaptics vest lets us render constraint states directly onto the body. Instead of a dashboard warning, you feel which regions are allowed, constrained, or blocked, making governance visceral instead of abstract.",
          status: "Installed",
          proof:
            "Haptic playback logs linked to treaty state and user actions.",
          connections: ["xr-proof-games", "xr-trust-lens"],
          actions: [
            "Design a haptic pattern",
            "Map treaty states to haptics",
            "Run a constraint playback"
          ],
          links: [{ label: "Haptics mapping sketch", href: "#" }]
        },
        {
          id: "xr-vision-pro",
          title: "Apple Vision Pro",
          tagline: "High-fidelity spatial canvas for trust overlays.",
          description:
            "Vision Pro becomes a canvas for trust overlays, teleoperation views, and embodied debugging. It is less about spectacle and more about making constraint and proof states legible in the room.",
          status: "Planned",
          proof:
            "Captured sessions where trust overlays align with runtime logs and user intent.",
          connections: ["xr-trust-lens", "xr-governed-teleop", "core-omega-sense"],
          actions: [
            "Sketch a Vision Pro scene",
            "Map proof overlays to objects",
            "Prototype a governed tool view"
          ],
          links: [{ label: "Vision Pro scene notes", href: "#" }]
        },
        {
          id: "xr-quest-3",
          title: "Meta Quest 3",
          tagline: "Accessible headset for multi-user governance sandboxes.",
          description:
            "Quest 3 provides an accessible way to bring multiple people into a governed environment. It is ideal for governance sandboxes, learning games, and quick experiments around embodied constraints.",
          status: "Planned",
          proof:
            "Multi-user sessions where treaty outcomes match recorded behaviour.",
          connections: ["xr-governed-teleop", "xr-governance-sandbox"],
          actions: [
            "Define a sandbox scenario",
            "Prototype a multi-user session",
            "Record a governance playthrough"
          ],
          links: [{ label: "Quest sandbox concepts", href: "#" }]
        },
        {
          id: "xr-governed-teleop",
          title: "Governed Teleoperation",
          tagline: "Teleop where every motion is under a treaty.",
          description:
            "Governed teleoperation turns teleop from a raw control channel into a governed experience. Operators feel which moves are allowed, which are blocked, and why — in real time, with proofs attached.",
          status: "Planned",
          proof:
            "Teleop sessions that produce per-move justification and constraint proofs.",
          connections: [
            "sim-omniverse-isaac",
            "xr-rokoko",
            "xr-quest-3",
            "xr-vision-pro",
            "core-omega-sense"
          ],
          actions: [
            "Design a teleop treaty",
            "Simulate a teleop session",
            "Attach proofs to teleop logs"
          ],
          links: [{ label: "Teleoperation design notes", href: "#" }]
        },
        {
          id: "xr-trust-lens",
          title: "Spatial “Trust Lens” Experience",
          tagline: "See trust state overlaid on tools, agents, and rooms.",
          description:
            "The trust lens turns invisible states — trust, risk, constraint — into visible overlays in space. Instead of guessing what the system believes, you see it anchored to objects, surfaces, and agents around you.",
          status: "Planned",
          proof:
            "Sessions where overlays correctly predict and explain runtime decisions.",
          connections: [
            "core-irreducibility",
            "xr-vive",
            "xr-vision-pro",
            "xr-bhaptics"
          ],
          actions: [
            "Define trust overlay primitives",
            "Map overlays to proof states",
            "Capture a trust lens walkthrough"
          ],
          links: [{ label: "Trust lens storyboard", href: "#" }]
        },
        {
          id: "xr-proof-games",
          title: "Proof-based Learning Games",
          tagline: "Games that emit real proof objects.",
          description:
            "Learning games built on OMEGA teach governance, traceability, and reasoning by making proofs the win condition. You do not just win a match; you produce an artefact that can be inspected and reused.",
          status: "Planned",
          proof:
            "Game sessions that emit proof bundles capturing strategy, constraints, and outcomes.",
          connections: [
            "core-proof-system",
            "xr-bhaptics",
            "xr-rokoko"
          ],
          actions: [
            "Define a game proof object",
            "Design a teaching loop",
            "Simulate a session with proofs"
          ],
          links: [{ label: "Game concepts", href: "#" }]
        }
      ]
    },
    {
      id: "simulation-robotics",
      title: "Simulation & Robotics",
      description:
        "Simulation backends and robotics hooks where treaties, proofs, and embodiment meet physics.",
      nodes: [
        {
          id: "sim-omniverse-isaac",
          title: "Omniverse + Isaac Sim",
          tagline: "High-fidelity digital twins under treaty control.",
          description:
            "Omniverse and Isaac Sim provide a photorealistic, programmable twin of the lab. OMEGA uses this to test treaties, teleop policies, and constraint regimes before touching real hardware.",
          status: "Installed",
          proof:
            "Simulation runs with attached constraint outcomes and divergence reports versus real-world traces.",
          connections: [
            "xr-rokoko",
            "xr-vive",
            "sim-digital-twin-pipeline",
            "core-omega-sense"
          ],
          actions: [
            "Replay a twin scenario",
            "Compare sim vs real traces",
            "Stress-test a new treaty"
          ],
          links: [{ label: "Twin pipeline notes", href: "#" }]
        },
        {
          id: "sim-mujoco",
          title: "MuJoCo",
          tagline: "Lightweight physics sandbox for fast iterations.",
          description:
            "MuJoCo offers a lighter-weight physics environment for quick experiments and policy sketches. It is ideal when you want to test a narrow question about control, stability, or constraint behaviour.",
          status: "Installed",
          proof:
            "Simulation traces and policy rollouts exported as compact proof objects.",
          connections: ["sim-digital-twin-pipeline", "agents-local-stack"],
          actions: [
            "Run a small control experiment",
            "Export a rollout as proof",
            "Compare different constraint sets"
          ],
          links: [{ label: "MuJoCo experiment list", href: "#" }]
        },
        {
          id: "sim-digital-twin-pipeline",
          title: "Digital Twin Pipeline",
          tagline: "From sensors and treaties into a live twin.",
          description:
            "The digital twin pipeline connects capture devices, treaties, and simulation backends into a coherent flow. It lets you move between room, sim, and proofs without losing context.",
          status: "Planned",
          proof:
            "End-to-end runs where each segment of the pipeline is covered by verifiable artefacts.",
          connections: [
            "sim-omniverse-isaac",
            "sim-mujoco",
            "xr-rokoko",
            "xr-vision-pro"
          ],
          actions: [
            "Sketch a twin for a new room",
            "Map capture streams into sim",
            "Define pipeline health checks"
          ],
          links: [{ label: "Pipeline design sketch", href: "#" }]
        },
        {
          id: "sim-safety-playback",
          title: "Safety / Constraint Playback",
          tagline: "Replaying constraints as a first-class artefact.",
          description:
            "Safety playback lets you scrub through constraint regimes the way you would scrub through video. You can see which rules fired when, what they blocked, and how that felt in the room or simulation.",
          status: "Planned",
          proof:
            "Playback sessions that align safety events, haptics, and user actions into one coherent trace.",
          connections: [
            "sim-omniverse-isaac",
            "xr-bhaptics",
            "xr-trust-lens",
            "core-omega-sense"
          ],
          actions: [
            "Design a playback UI",
            "Attach playback to proofs",
            "Run a post-incident review"
          ],
          links: [{ label: "Safety playback concepts", href: "#" }]
        }
      ]
    },
    {
      id: "agents-compute",
      title: "Agents & Compute",
      description:
        "Agent stacks, inference backends, and tuning loops that live under treaties and emit proofs.",
      nodes: [
        {
          id: "agents-local-stack",
          title: "Local Agent Stack",
          tagline: "Ollama + Chroma + LlamaIndex under OMEGA governance.",
          description:
            "A local agent stack built from Ollama, Chroma, and LlamaIndex runs inside the treaty runtime. It turns ordinary LLM workflows into governed, logged, and provable behaviours.",
          status: "Built",
          proof:
            "Agent traces, retrieval logs, and decision graphs attached to treaty and verifier outputs.",
          connections: [
            "core-treaty-runtime",
            "core-research-lab",
            "core-unified-verifier",
            "core-omega-sense"
          ],
          actions: [
            "Inspect an agent trace",
            "Review retrieval justifications",
            "Register an agent as a verifier"
          ],
          links: [{ label: "Local stack overview", href: "#" }]
        },
        {
          id: "agents-exo-inference",
          title: "Exo Distributed Inference",
          tagline: "Distributed inference as a governed resource.",
          description:
            "Exo-scale inference becomes another governed resource: who can run what, where, and with which proof obligations. It connects OMEGA’s treaties to external compute fabrics.",
          status: "Planned",
          proof:
            "Job histories and resource usage traces linked to treaty and pricing constraints.",
          connections: [
            "agents-local-stack",
            "core-proof-system",
            "core-unified-verifier"
          ],
          actions: [
            "Design a governed inference policy",
            "Attach proofs to jobs",
            "Simulate load scenarios"
          ],
          links: [{ label: "Exo integration sketch", href: "#" }]
        },
        {
          id: "agents-mlx-fine-tuning",
          title: "MLX Fine-tuning",
          tagline: "On-device adaptation with constraint-aware loops.",
          description:
            "MLX fine-tuning lets OMEGA adapt models on-device while staying inside tight constraint loops. It is a way to update behaviour without losing the proof trail that led you there.",
          status: "Planned",
          proof:
            "Training runs with explicit before/after comparisons and constraint checks.",
          connections: [
            "core-research-lab",
            "agents-local-stack",
            "sim-mujoco"
          ],
          actions: [
            "Define a fine-tuning experiment",
            "Attach evaluation metrics",
            "Export training proof bundle"
          ],
          links: [{ label: "MLX tuning notes", href: "#" }]
        }
      ]
    }
  ]
};

export const PLATFORM_PREVIEW_IDS: string[] = [
  "core-omega-protocol",
  "core-treaty-runtime",
  "core-proof-system",
  "core-research-lab",
  "core-omega-sense",
  "xr-governed-teleop",
  "sim-omniverse-isaac",
  "agents-local-stack"
];

