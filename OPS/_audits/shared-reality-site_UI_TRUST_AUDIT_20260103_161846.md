# Shared Reality Site — UI + Trust Audit

- Date: Sat Jan  3 16:18:46 GMT 2026
- Site: /Users/warre/Omega/shared-reality-site
- Purpose: make it world-class for care / ND / vulnerable communities audiences
- Benchmarks: GOV.UK (clarity + accessibility), charity:water (warm trust), Long Now/Tufte (restraint + authority)

## 0. Ground rules for this audit
- Human-first, low cognitive load, no hype.
- No surveillance vibe. No clinical vibe. No 'AI product' vibe.
- Every element must reduce confusion or increase safety.

## 1. Inventory

### 1.1 Routes
- src/app/page.tsx

### 1.2 Sections
- Contact.tsx
- Evidence.tsx
- Footer.tsx
- Hero.tsx
- HowItWorks.tsx
- MobileNav.tsx
- Nav.tsx
- Pilot.tsx
- WhatItIs.tsx
- WhoItsFor.tsx

### 1.3 Content sources
- canon_prompts.ts
- copy.ts
- outputs.ts
- pilot.ts
- prompts.ts

## 2. What the user experiences (first 30 seconds)
### 2.1 Hero + first screen copy
```
import { Container } from "@/components/ui/Container";
import { site } from "@/content/copy";

export function Hero() {
  return (
    <section className="border-b">
      <Container className="py-16 sm:py-20">
        <p className="text-sm text-neutral-500">Human-led · ND-aware · Practical · Safe-by-design</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Help teams see the <span className="underline decoration-neutral-300">same situation</span> clearly — before pressure turns into harm.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-neutral-600">
          Shared Reality is a facilitated programme for care, schools, social enterprises, and community teams.
          It reduces accidental harm caused by misalignment: different people acting from different versions of reality.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="rounded-lg bg-black px-4 py-2 text-white" href="#pilot">
            {site.ctaSecondary}
          </a>
          <a className="rounded-lg border px-4 py-2" href="#what">
            What it is
          </a>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Situation-first", d: "We work on the situation, not diagnosing the person." },
            { t: "ND-aware", d: "Multiple modes of expression, time, and safety by default." },
            { t: "Decision-safe", d: "Creates pauses and clarity at the moments that matter." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border p-4">
              <div className="font-medium">{c.t}</div>
              <div className="mt-1 text-sm text-neutral-600">{c.d}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

```

### 2.2 Navigation (information architecture)
```
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { MobileNav } from "@/components/sections/MobileNav";
import { nav, site } from "@/content/copy";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          {site.title}
        </Link>
        <nav className="hidden items-center gap-5 sm:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-neutral-600 hover:text-neutral-900">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#contact"
          className="hidden rounded-lg bg-black px-3 py-2 text-sm font-medium text-white sm:inline-block"
        >
          {site.ctaPrimary}
        </a>
        <MobileNav />
      </Container>
    </header>
  );
}

```

### 2.3 Overall page order
```
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { WhatItIs } from "@/components/sections/WhatItIs";
import { WhoItsFor } from "@/components/sections/WhoItsFor";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Pilot } from "@/components/sections/Pilot";
import { Evidence } from "@/components/sections/Evidence";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <Nav />
      <Hero />
      <WhatItIs />
      <WhoItsFor />
      <HowItWorks />
      <Pilot />
      <Evidence />
      <Contact />
      <Footer />
    </main>
  );
}
```

## 3. Design system + accessibility
### 3.1 Global CSS tokens
```
@tailwind base;
@tailwind components;
@tailwind utilities;

html { scroll-behavior: smooth; }
body { text-rendering: optimizeLegibility; }

::selection { background: rgba(0,0,0,0.12); }

a { text-underline-offset: 4px; }

:focus-visible {
  outline: 2px solid #000;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 3.2 Layout metadata
```
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Reality Programme",
  description:
    "A human-led programme helping care, education, and community teams align understanding before pressure turns into harm.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

## 4. Trust & care signals (content)
### 4.1 What it is / who it's for / how it works

#### WhatItIs.tsx
```
import { Section } from "@/components/ui/Section";

export function WhatItIs() {
  return (
    <Section id="what" eyebrow="What it is" title="A simple programme for shared understanding under pressure">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <div className="font-medium">The problem</div>
          <p className="mt-2 text-neutral-600">
            Most harm in complex care and community systems isn&apos;t caused by bad intent.
            It happens when people are sincere, competent, and acting fast — but from different versions of what&apos;s going on.
          </p>
        </div>
        <div className="rounded-2xl border p-5">
          <div className="font-medium">The result</div>
          <p className="mt-2 text-neutral-600">
            Escalations, burnout, defensiveness, missed needs, and avoidable conflict — especially when neurodiversity,
            trauma, or resource constraints are in the room.
          </p>
        </div>
        <div className="rounded-2xl border p-5 sm:col-span-2">
          <div className="font-medium">What Shared Reality does</div>
          <p className="mt-2 text-neutral-600">
            We facilitate structured sessions that slow the room down just enough to surface pressures,
            align perspectives, and agree safer next steps — without blame, surveillance, or forced disclosure.
          </p>
        </div>
      </div>
    </Section>
  );
}

```

#### WhoItsFor.tsx
```
import { Section } from "@/components/ui/Section";

export function WhoItsFor() {
  return (
    <Section id="who" eyebrow="Who it's for" title="Built for care, education, and community contexts">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "Social enterprises & NGOs", d: "Frontline teams supporting vulnerable communities." },
          { t: "Schools & ALNs/ND", d: "Staff, learners, and families navigating pressure and difference." },
          { t: "NHS-adjacent services", d: "Community mental health, pathways, and multidisciplinary teams." },
          { t: "Local authorities", d: "Cross-boundary coordination and safer decision-making." },
          { t: "ND organisations", d: "Lived experience centred, practical inclusion." },
          { t: "Stakeholder groups", d: "Boards, commissioners, multi-agency partnerships." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border p-5">
            <div className="font-medium">{c.t}</div>
            <div className="mt-1 text-sm text-neutral-600">{c.d}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

```

#### HowItWorks.tsx
```
import { Section } from "@/components/ui/Section";

export function HowItWorks() {
  return (
    <Section id="how" eyebrow="How it works" title="Five session types, one consistent structure">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { t: "Orientation", d: "Safety, expectations, shared language. No forced disclosure." },
          { t: "Pressure Mapping", d: "Make invisible strain visible. Name pressures (not people)." },
          { t: "Shared Reality Session", d: "Align on one real situation. Multiple perspectives held safely." },
          { t: "Decision Moments", d: "Practice pausing under pressure. Make assumptions explicit." },
          { t: "Reflection & Learning", d: "Capture learning safely. Leadership brief. Decide next." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border p-5">
            <div className="font-medium">{c.t}</div>
            <div className="mt-1 text-sm text-neutral-600">{c.d}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

```

#### Pilot.tsx
```
import { Section } from "@/components/ui/Section";
import { pilot } from "@/content/pilot";

export function Pilot() {
  return (
    <Section id="pilot" eyebrow="Pilot" title="A light-touch pilot (4–6 weeks)">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <div className="font-medium">Format</div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-neutral-700">
            <li>Duration: {pilot.duration}</li>
            <li>Cohort: {pilot.cohortSize}</li>
            <li>Human-facilitated sessions</li>
            <li>ND-aware by default</li>
          </ul>
        </div>
        <div className="rounded-2xl border p-5">
          <div className="font-medium">Guardrails</div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-neutral-700">
            {pilot.guardrails.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border p-5 sm:col-span-2">
          <div className="font-medium">Pilot phases</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {pilot.phases.map((p) => (
              <div key={p.title} className="rounded-xl border bg-white p-4">
                <div className="text-sm font-medium">{p.title}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {p.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

```

#### Evidence.tsx
```
import { Section } from "@/components/ui/Section";

export function Evidence() {
  return (
    <Section id="evidence" eyebrow="Evidence" title="Measuring conditions, not people">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { t: "Shared understanding", d: "Fewer 'they don't get it' loops. More aligned summaries." },
          { t: "Decision quality", d: "More explicit pauses, clearer assumptions, safer next steps." },
          { t: "ND inclusion", d: "More participation across modes; reduced exclusion-by-speed." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border p-5">
            <div className="font-medium">{c.t}</div>
            <div className="mt-1 text-sm text-neutral-600">{c.d}</div>
          </div>
        ))}
        <div className="rounded-2xl border p-5 sm:col-span-3">
          <div className="font-medium">Low-burden evidence collection</div>
          <p className="mt-2 text-neutral-600">
            Short reflections, facilitator synthesis notes, and a one-page leadership brief.
            No surveillance. No performance scoring. No clinical claims.
          </p>
        </div>
      </div>
    </Section>
  );
}

```

#### Contact.tsx
```
import { Section } from "@/components/ui/Section";
import { site } from "@/content/copy";

export function Contact() {
  return (
    <Section id="contact" eyebrow="Contact" title="If you want a pilot, we'll make it simple">
      <div className="rounded-2xl border p-6">
        <p className="text-neutral-700">
          Email: <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>
          <span className="text-neutral-500"> · {site.location}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="rounded-lg bg-black px-4 py-2 text-white" href={`mailto:${site.email}?subject=Shared%20Reality%20Pilot`}>
            Request a pilot call
          </a>
          <a className="rounded-lg border px-4 py-2" href="#pilot">
            Review pilot outline
          </a>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          We can tailor for: social enterprises, schools, ND groups, stakeholder partnerships, and community mental health contexts.
        </p>
      </div>
    </Section>
  );
}

```

#### Footer.tsx
```
import { Container } from "@/components/ui/Container";
import { site } from "@/content/copy";

export function Footer() {
  return (
    <footer className="border-t py-10">
      <Container className="flex flex-col gap-2 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
        <div>© {new Date().getFullYear()} {site.title}</div>
        <div className="flex gap-4">
          <a className="hover:text-neutral-800" href="#what">What</a>
          <a className="hover:text-neutral-800" href="#pilot">Pilot</a>
          <a className="hover:text-neutral-800" href="#contact">Contact</a>
        </div>
      </Container>
    </footer>
  );
}

```

## 5. OMEGA-F Findings (ruthless)

### 5.1 Primary signal (what the site *actually* communicates)
- [FILL] Does it read as: safe, calm, human-led programme? Or: generic consultancy? Or: AI-ish?

### 5.2 Misalignments / leakage
- [FILL] Any copy that risks: diagnosis vibe, compliance vibe, therapy vibe, AI vibe, coercion vibe.
- [FILL] Any UI that increases anxiety: too many choices, unclear labels, marketing tropes, hidden info.

### 5.3 Cognitive load map
- [FILL] What must be understood in 10s / 30s / 2min.
- [FILL] Where confusion accumulates.

### 5.4 Audience fit (four rooms)
- Frontline practitioner: [FILL]
- ND participant / lived experience: [FILL]
- Leader / commissioner: [FILL]
- Partner org (NGO / school / NHS-adjacent): [FILL]

### 5.5 Authority + warmth balance
- Where it's too cold: [FILL]
- Where it's too soft / vague: [FILL]

## 6. Fix plan (two phases)

### Phase 1 — Fast fixes (1–2 hours)
- [ ] Fix any button/text contrast issues.
- [ ] Tighten hero copy to one clear sentence + one reassurance line.
- [ ] Rename nav labels to plain-English (GOV.UK style).
- [ ] Add a single 'What happens in a session' block (predictability = safety).
- [ ] Add an explicit 'What this is NOT' (therapy, diagnosis, performance management, surveillance).

### Phase 2 — World-class rebuild (half day)
- [ ] Implement a calm typographic system (serif headings + readable sans body).
- [ ] Add 'One thing per section' pacing (reduce density).
- [ ] Create 2 micro-stories (anonymised) that show care impact without exploiting vulnerability.
- [ ] Add accessibility polish (focus states, reduced motion, headings, landmarks).
- [ ] Add printable 1-page pilot PDF-like page (commissioner-friendly).

## 7. Output needed from you (to finish audit)
- 2–3 sentences: what does your wife *want people to feel* when they land on the site?
- 3 audiences in order of priority.
- 1 real scenario (anonymised) the programme helped (or would help).


## Appendix — Automated scans

### A1. Suspicious words (therapy/clinical/compliance/AI vibes)
```
src/components/sections/Evidence.tsx:21:            No surveillance. No performance scoring. No clinical claims.
src/components/sections/Footer.tsx:1:import { Container } from "@/components/ui/Container";
src/components/sections/Footer.tsx:7:      <Container className="flex flex-col gap-2 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
src/components/sections/Footer.tsx:14:      </Container>
src/components/sections/Pilot.tsx:18:          <div className="font-medium">Guardrails</div>
src/components/sections/Pilot.tsx:20:            {pilot.guardrails.map((g) => (
src/components/sections/Contact.tsx:9:          Email: <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>
src/components/sections/Contact.tsx:13:          <a className="rounded-lg bg-black px-4 py-2 text-white" href={`mailto:${site.email}?subject=Shared%20Reality%20Pilot`}>
src/components/sections/Contact.tsx:21:          We can tailor for: social enterprises, schools, ND groups, stakeholder partnerships, and community mental health contexts.
src/components/sections/HowItWorks.tsx:9:          { t: "Pressure Mapping", d: "Make invisible strain visible. Name pressures (not people)." },
src/components/sections/WhatItIs.tsx:18:            trauma, or resource constraints are in the room.
src/components/sections/WhatItIs.tsx:25:            align perspectives, and agree safer next steps — without blame, surveillance, or forced disclosure.
src/components/sections/Nav.tsx:2:import { Container } from "@/components/ui/Container";
src/components/sections/Nav.tsx:9:      <Container className="flex h-14 items-center justify-between">
src/components/sections/Nav.tsx:27:      </Container>
src/components/sections/Hero.tsx:1:import { Container } from "@/components/ui/Container";
src/components/sections/Hero.tsx:7:      <Container className="py-16 sm:py-20">
src/components/sections/Hero.tsx:27:            { t: "Situation-first", d: "We work on the situation, not diagnosing the person." },
src/components/sections/Hero.tsx:37:      </Container>
src/components/ui/Section.tsx:2:import { Container } from "@/components/ui/Container";
src/components/ui/Section.tsx:19:      <Container>
src/components/ui/Section.tsx:35:      </Container>
src/components/ui/Container.tsx:3:export function Container({
src/content/pilot.ts:11:      bullets: ["Surface invisible strain", "Name pressures (not people)", "Map where misalignment forms"],
src/content/pilot.ts:26:  guardrails: [
src/content/pilot.ts:28:    "No surveillance",
src/content/pilot.ts:31:    "Human-facilitated (AI is backstage only)",
src/content/copy.ts:6:  email: "hello@sharedreality.org", // TODO: replace
src/app/globals.css:1:@tailwind base;
src/app/globals.css:2:@tailwind components;
src/app/globals.css:3:@tailwind utilities;
src/app/page.tsx:13:    <main className="min-h-screen bg-white text-neutral-900">
src/app/page.tsx:23:    </main>
```

### A2. Button/link classes usage
```
src/components/sections/Footer.tsx:10:          <a className="hover:text-neutral-800" href="#what">What</a>
src/components/sections/Footer.tsx:11:          <a className="hover:text-neutral-800" href="#pilot">Pilot</a>
src/components/sections/Footer.tsx:12:          <a className="hover:text-neutral-800" href="#contact">Contact</a>
src/app/error.tsx:15:      <button
src/app/error.tsx:20:      </button>
src/components/sections/Nav.tsx:15:            <a key={item.href} href={item.href} className="text-sm text-neutral-600 hover:text-neutral-900">
src/components/sections/MobileNav.tsx:11:      <button
src/components/sections/MobileNav.tsx:17:      </button>
src/components/sections/Hero.tsx:17:          <a className="rounded-lg bg-black px-4 py-2 text-white" href="#pilot">
src/components/sections/Hero.tsx:20:          <a className="rounded-lg border px-4 py-2" href="#what">
src/components/sections/Contact.tsx:9:          Email: <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>
src/components/sections/Contact.tsx:13:          <a className="rounded-lg bg-black px-4 py-2 text-white" href={`mailto:${site.email}?subject=Shared%20Reality%20Pilot`}>
src/components/sections/Contact.tsx:16:          <a className="rounded-lg border px-4 py-2" href="#pilot">
```

### A3. Headings structure
```
src/app/not-found.tsx:6:      <h1 className="text-xl font-semibold">Page not found</h1>
src/app/error.tsx:11:      <h2 className="text-lg font-semibold">Something went wrong</h2>
src/components/sections/Hero.tsx:9:        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
```
