# BUILD PLAN — Omega RC + Protocol Site

## Scope (locked)
1) Omega RC web app: paste a claim/headline → outputs 5-section "inspection" (Claim / Shown / Assumed / Missing / Alternative framings).
2) Omega Protocol site: canonical pages (Home, How It's Used, Examples, Industries, Protocols, Stewardship, Contact).
3) Publishing assets later: 2-page PDFs (Omega + Omega-A), workshop deck, implementation guide.

## Build Blocks (ordered, locked)
### Block 1 — Structure & Routing (OMEGA-B)
- Create this file and establish the execution workflow.

### Block 2 — Omega RC Input→Output Path (OMEGA-B)
- Ensure the app accepts short text and produces the 5 sections reliably (no long-form, no URL).
- Output must be fast, stable, and non-erroring.

### Block 3 — Omega RC UI Polish for Comprehension (OMEGA-V)
- Make it obvious "paste → see hidden structure".
- Reduce friction, simplify labels, improve layout.

### Block 4 — Omega Protocol Site Pages (OMEGA-B)
- Implement pages from the locked site scope.
- No marketing. Infrastructure tone.

### Block 5 — Examples + Industries Mapping (OMEGA v37)
- Write/verify examples are structurally correct and neutral.
- Ensure industry mapping is precise and non-hype.

### Block 6 — Guardrails + Copy Safety Pass (OMEGA-G)
- Ensure no implied verdicts, advice, persuasion, or authority.
- Ensure disclaimers and boundaries are consistent.

### Block 7 — Reflection + Simplification Pass (OMEGA-R)
- Reduce clutter, remove redundant sections, keep what helps users act.

## Cursor Execution Workflow (mandatory)
For each block:
1) Read block name + assigned Omega mode.
2) Use ONLY that mode's rules while executing the block.
3) Implement changes in small commits.
4) After completion, write a short "Block Done Note" into `BUILD_LOG.md`:
   - what changed
   - what's verified working
   - any remaining known issues (max 5 bullets)
5) Do not start the next block until Block Done Note exists.

## Definition of Done — Block 1
- `BUILD_PLAN.md` exists at repo root with the exact structure above.
- `BUILD_LOG.md` exists at repo root with a single entry: "Block 1 initialized".
- Repo builds and runs unchanged (no functional edits required in Block 1).














