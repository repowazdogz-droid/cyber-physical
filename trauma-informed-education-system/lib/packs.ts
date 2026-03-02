export interface PackItem {
  title: string;
  href: string;
}

export interface Pack {
  id: string;
  title: string;
  audience: "leadership" | "staff" | "parents";
  duration: string;
  description: string;
  items: PackItem[];
}

export const PACKS: Pack[] = [
  {
    id: "leadership-5min",
    title: "Leadership Quick Start",
    audience: "leadership",
    duration: "5 minutes",
    description: "Essential boundaries and inspection language for leaders.",
    items: [
      { title: "What this is / isn't", href: "/docs/foundations/principles" },
      { title: "Safeguarding boundaries", href: "/docs/governance/safeguarding" },
      { title: "Inspection framing", href: "/docs/delivery/inspection-framing" },
    ],
  },
  {
    id: "leadership-60min",
    title: "Leadership Deep Dive",
    audience: "leadership",
    duration: "60 minutes",
    description: "Complete system overview for leadership planning.",
    items: [
      { title: "Core principles", href: "/docs/foundations/principles" },
      { title: "Four pillars", href: "/docs/framework/pillars" },
      { title: "Implementation cycles", href: "/docs/delivery/implementation-cycles" },
      { title: "Core offer", href: "/docs/business/core-offer" },
      { title: "Safeguarding boundaries", href: "/docs/governance/safeguarding" },
      { title: "Inspection framing", href: "/docs/delivery/inspection-framing" },
    ],
  },
  {
    id: "staff-5min",
    title: "Staff Quick Start",
    audience: "staff",
    duration: "5 minutes",
    description: "Essential principles and boundaries for staff.",
    items: [
      { title: "Core principles", href: "/docs/foundations/principles" },
      { title: "Process maps", href: "/docs/framework/process-maps" },
      { title: "Safeguarding boundaries", href: "/docs/governance/safeguarding" },
    ],
  },
  {
    id: "staff-60min",
    title: "Staff Deep Dive",
    audience: "staff",
    duration: "60 minutes",
    description: "Complete framework for trauma-informed practice.",
    items: [
      { title: "Core principles", href: "/docs/foundations/principles" },
      { title: "Four pillars", href: "/docs/framework/pillars" },
      { title: "Process maps", href: "/docs/framework/process-maps" },
      { title: "Module 01: Foundations", href: "/docs/delivery/modules/module-01-foundations" },
      { title: "Module 03: Classroom Predictability", href: "/docs/delivery/modules/module-03-classroom-predictability" },
      { title: "Reflection tools", href: "/docs/delivery/reflection-tools" },
    ],
  },
  {
    id: "parents-5min",
    title: "Parents Quick Start",
    audience: "parents",
    duration: "5 minutes",
    description: "What parents need to know about the system.",
    items: [
      { title: "What this is", href: "/docs/foundations/principles" },
      { title: "Parent interface", href: "/docs/delivery/modules/module-07-parent-interface" },
      { title: "Boundaries", href: "/docs/governance/refusal-boundaries" },
    ],
  },
  {
    id: "parents-30min",
    title: "Parents Overview",
    audience: "parents",
    duration: "30 minutes",
    description: "Complete overview for parents and carers.",
    items: [
      { title: "Core principles", href: "/docs/foundations/principles" },
      { title: "Role translations", href: "/docs/framework/role-translations" },
      { title: "Parent interface", href: "/docs/delivery/modules/module-07-parent-interface" },
      { title: "Ethics", href: "/docs/governance/ethics" },
      { title: "Boundaries", href: "/docs/governance/refusal-boundaries" },
    ],
  },
];

export function getPack(id: string): Pack | null {
  return PACKS.find((p) => p.id === id) || null;
}

export function getPacksByAudience(audience: Pack["audience"]): Pack[] {
  return PACKS.filter((p) => p.audience === audience);
}

export function getPacksByDuration(duration: string): Pack[] {
  return PACKS.filter((p) => p.duration === duration);
}
























