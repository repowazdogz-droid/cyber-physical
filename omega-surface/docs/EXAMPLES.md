# OMEGA Surface — Usage Examples

## Room context

Use when building a **spatial, layered, inspect-only** surface (Constraint Room, Orientation Lab, Pressure Lab).

```ts
import {
  createRoomSurface,
  createEnvelope,
  sealEnvelope,
  verifyEnvelope,
  classifyToOntologyState,
  exportAsJson,
} from 'omega-surface';

// 1. Define room surface (no execution)
const room = createRoomSurface('Constraint Room', {
  presets: [
    {
      id: 'full',
      label: 'All layers',
      visible_layers: ['structure', 'constraints', 'uncertainty', 'assumptions'],
      description: 'Show everything',
    },
  ],
  inspector: true,
  freeze: true,
});
console.log(room.execution); // false

// 2. Classify content into ontology
const ontology = classifyToOntologyState([
  { id: 's1', label: 'Entity A', description: 'Main entity', layer: 'structure', relationships: [] },
  { id: 'c1', label: 'Limit X', description: 'Must hold', layer: 'constraints', falsifiable: true },
]);

// 3. Create and seal an artifact (e.g. after user freezes)
const unsealed = createEnvelope('constraint-room-snapshot', { entities: [] }, ontology);
const sealed = await sealEnvelope(
  unsealed,
  [
    { node_type: 'OBSERVE', content: { view: 'full' } },
    { node_type: 'DECIDE', content: { frozen: true } },
  ],
  {
    deterministic_modules: ['classify'],
    llm_modules: [],
    verification_status: 'verified',
    verified_claims: 0,
    unverified_claims: 0,
    flagged_claims: 0,
  },
  ['Single snapshot; no replay']
);
const ok = await verifyEnvelope(sealed);
console.log(ok.valid); // true

// 4. Export for sharing
const json = exportAsJson(sealed);
```

---

## Terminal context

Use when building a **pipeline** (R&D engine, Decision engine) with stages and integrity.

```ts
import {
  createTerminalSurface,
  createEnvelope,
  sealEnvelope,
  verifyEnvelope,
  verifyClaimsPostHoc,
  detectTamper,
  exportAsHtml,
  classifyToOntologyState,
} from 'omega-surface';

// 1. Define terminal and stages
const terminal = createTerminalSurface(
  'Decision Engine',
  [
    { id: 's1', label: 'Strategic Assessment', order: 1, type: 'generation', deterministic: false },
    { id: 's2', label: 'Options Analysis', order: 2, type: 'generation', deterministic: false },
    { id: 's3', label: 'Risk & Governance', order: 3, type: 'verification', deterministic: true },
    { id: 's4', label: 'Board Brief', order: 4, type: 'export', deterministic: false },
  ],
  { hash_chain: true, post_hoc_verification: true }
);

// 2. Run pipeline (pseudo: each stage produces output)
const stageOutputs = [
  { stage: 's1', output: { assessment: '...' } },
  { stage: 's2', output: { options: [] } },
  { stage: 's3', output: { risks: [] } },
  { stage: 's4', output: { brief: '...' } },
];

// 3. Build ontology from pipeline result
const ontology = classifyToOntologyState([]);

// 4. Create envelope and seal with chain
const unsealed = createEnvelope(
  'decision-brief',
  { stages: stageOutputs },
  ontology
);
const sealed = await sealEnvelope(
  unsealed,
  stageOutputs.map((s) => ({ node_type: 'STAGE' as const, content: s })),
  {
    deterministic_modules: ['s3'],
    llm_modules: ['s1', 's2', 's4'],
    verification_status: 'partial',
    verified_claims: 1,
    unverified_claims: 2,
    flagged_claims: 0,
  },
  ['Claims from s1/s2 not independently verified']
);

// 5. Post-hoc verification of claims (inject your verifier)
const summary = await verifyClaimsPostHoc(
  [
    { id: '1', text: 'Key claim A', source_stage: 's1', verifiable: true },
    { id: '2', text: 'Key claim B', source_stage: 's2', verifiable: true },
  ],
  async (claim) => {
    // Your logic: search API, citation check, etc.
    return { claim_id: claim.id, status: 'verified', confidence: 0.9 };
  }
);
console.log(summary.summary.verified, summary.coverage);

// 6. Tamper check
const tamper = await detectTamper(sealed);
console.log(tamper.tampered); // false

// 7. Export as self-verifying HTML
const html = exportAsHtml(sealed);
// Save or serve html; recipient opens in browser and sees "Integrity valid" or "Integrity check failed"
```

---

## Cross-product verification

A sealed artifact from **Spine Case** and a sealed artifact from **REFLEXIVE** both use the same envelope shape and can both be verified by the same `verifyEnvelope()`:

```ts
import { verifyEnvelope } from 'omega-surface';

const spineArtifact = await loadFromSpineCase();   // ArtifactEnvelope<SpineCasePayload>
const reflexiveArtifact = await loadFromReflexive(); // ArtifactEnvelope<ReflexiveSynthesis>

const r1 = await verifyEnvelope(spineArtifact);
const r2 = await verifyEnvelope(reflexiveArtifact);

if (r1.valid && r2.valid) {
  console.log('Both artifacts intact');
}
```

No product-specific logic is required for verification — only the shared `omega-surface` package.
