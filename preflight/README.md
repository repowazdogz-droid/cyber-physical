# Preflight — UNIFIED + FORGE in one run

Four prompts you can paste into **Cursor** (or any LLM) when OMEGA UNIFIED and OMEGA FORGE context is active. Each produces a single artifact: a one-pager, a leverage list, a meeting handoff, or a gap map.

**Launcher:** Open `preflight/index.html` in a browser (or run a local server from `preflight/`). Pick a run type, fill the field, click **Build prompt & copy to clipboard**, then paste into Cursor and send.

Use when:
- **Decision preflight** — Before a G3/G4 decision (irreversible or identity-defining).
- **Leverage scan** — Weekly or when you feel busy but not moving.
- **Meeting handoff** — After a call; you need to relay or remember what was decided.
- **Absence detector** — Find what’s missing in your domain; breakthrough lens.

---

## 1. Decision preflight

**When:** You're about to commit to something irreversible or identity-defining (capital, reputation, relationship, positioning). You want assumptions surfaced, failure conditions named, and one thing that would change your mind.

**Paste this into Cursor, then add your decision and gravity below.**

```
Run as OMEGA UNIFIED + OMEGA FORGE.

DECISION PREFLIGHT

Decision (one sentence): [PASTE HERE]

Gravity: [G3 — Irreversible | G4 — Identity-defining]

Produce a single one-pager artifact with these sections. No filler. Operator-standard: a competent person could use this to decide or to kill the decision.

1. LOAD-BEARING ASSUMPTIONS
   List the 3 assumptions that most determine the outcome. For each: one line.
   Use FORGE Assumption Excavator: which is least examined? Mark it.

2. FAILURE CONDITIONS
   INVERSION: What would guarantee this fails? List 3–5. Be specific.

3. SECOND-ORDER EFFECTS
   If we do this, what happens next? (Next 6–12 months.) What becomes possible? What becomes impossible or harder?

4. KILL SIGNALS
   What would make you stop or reverse? (Observable, not vague.)

5. DOUBLE SIGNALS
   What would confirm this is the right move? (Observable.)

6. ONE THING THAT WOULD CHANGE MY MIND
   Single sentence. Evidence or event that would flip the decision.

7. REDUCTION HORIZON
   If reasoning has reached values or non-falsifiable claims, state: "Explanation ends here. What follows is choice." and stop.

Output format: markdown one-pager, copy-paste ready. No preamble.
```

---

## 2. Leverage scan

**When:** You want to find the one move that's low effort / high return, reputation compounding, or option-creating. Run weekly or when stuck.

**Paste this into Cursor, then add your context below.**

```
Run as OMEGA UNIFIED + OMEGA FORGE.

LEVERAGE SCAN

Context (2–3 lines: current focus, current constraint, one metric that matters): [PASTE HERE]

Apply UNIFIED Leverage Detection + Trajectory Guard. Scan for moves that are:
- low effort / high strategic return
- reputation compounding
- revenue accelerating or option-creating
- network expanding

Output a single artifact:

1. TOP 3 CANDIDATE MOVES
   For each: one line description, one line why it's leverage, one line cost/effort.
   Mark the highest leverage one.

2. KILL SIGNALS (for the top move)
   What would mean this move was wrong? Observable.

3. NEXT MOVE
   One concrete next step (calendar, message, or 30-minute block). If none is obvious, say "Need: [single missing input]".

4. DRIFT CHECK
   Is the current focus aligned with the top candidate? If not, one sentence on the gap.

No persuasion. Options + trade-offs only. Output: markdown, copy-paste ready.
```

---

## 3. Meeting handoff (RELAY)

**When:** You had a meeting (or read a long doc). You need to relay it to someone else or remember what was decided. You want SIGNAL + EXPLANATION + human-ready synthesis.

**Paste this into Cursor, then paste your meeting notes or transcript below.**

```
Run as OMEGA UNIFIED in RELAY mode.

MEETING HANDOFF

Meeting notes or transcript: [PASTE HERE]

Produce the four RELAY shapes in order:

1. SIGNAL
   What you say in 10–20 seconds. 1–3 bullets. No jargon. No caveats.

2. EXPLANATION
   What you say when asked "why?" Short paragraph or 3–5 bullets.

3. HUMAN SYNTHESIS
   What a high-judgment person would naturally say. Socially fluent. No framework language. ≤ 90 seconds spoken.

4. TRACE
   Key assumptions, uncertainties, failure modes, confidence band. Compact.

If explanation collapses into axioms or values, declare: "Explanation ends here. What follows is choice."

Output: markdown. Copy-paste ready for email, Slack, or brief.
```

---

## 4. Absence detector

**When:** You want to find what’s conspicuously missing in your space — what nobody builds, asks, or names. FORGE breakthrough move.

See `preflight/prompts/absence-detector.md` for the full copy-paste prompt.

---

## How to use in Cursor

1. Open Cursor in the Omega project (so UNIFIED + FORGE rules load).
2. Copy the prompt you need (Decision / Leverage / Meeting).
3. Replace `[PASTE HERE]` with your decision, context, or notes.
4. Send. Use the output as the artifact — one-pager, leverage list, or handoff.

Prompt files live in `preflight/prompts/` (decision-preflight, leverage-scan, meeting-handoff, absence-detector). No extra tools. Full capability of both prompts, on demand.
