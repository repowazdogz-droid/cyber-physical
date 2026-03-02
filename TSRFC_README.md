# TSRFC – Translational Surgical Feasibility Compiler (v0.2)

TSRFC is a deterministic, rule-based tool for mapping **surgical innovation concepts** against **real procedures**.

It does three things:

1. Decomposes a procedure into **unit operations**
2. Surfaces **failure surfaces** (technical, workflow, economic, evidence, adoption)
3. Builds simple **evidence** and **adoption** profiles

Current presets: **spine**, **ENT**, **endoscopy**  
Core examples: MIS lumbar decompression (spine) and colonoscopy screening (endoscopy).

---

## 1. Install

```bash
git clone <this-repo>
cd tsrfc
pip install -e .
```

Requires Python 3.10+.

---

## 2. Discover What's Available

List known domains:

```bash
tsrfc list-domains
```

List procedures (all):

```bash
tsrfc list-procedures
```

List procedures in one domain:

```bash
tsrfc list-procedures --domain spine
tsrfc list-procedures --domain endoscopy
```

---

## 3. Run a Check (Single Concept)

### Spine – MIS Lumbar Decompression

```bash
tsrfc check examples/spine_mis_l4_l5_demo.json
```

You will see:
- **Procedure**: ID, domain, notes
- **Concept**: role, capital/disposable cost bands, learning curve
- **Unit operations**: sequence with goals and innovation hooks
- **Failure surfaces**:
  - technical (e.g., dural tear, incomplete decompression)
  - workflow (e.g., setup complexity)
  - economic (capital ROI pressure)
  - evidence (evidence gaps)
  - adoption (learning curve, etc.)
- **Evidence profile**: current level, target level, endpoints, sample size, centres, horizon
- **Adoption profile**: trajectory, primary barriers, leverage points, kill criteria
- **Scores**: simple summary metrics (risk per category, evidence strength, adoption risk load)

### Endoscopy – Colonoscopy Screening with AI Overlay

```bash
tsrfc check examples/endo_colonoscopy_ai_demo.json
```

Shows the same structure in a different domain:
- lighter unit ops
- different workflow and evidence load
- different adoption profile

---

## 4. Head-to-Head Comparison (Two Concepts)

Compare two concepts on the same procedure:

```bash
tsrfc compare \
  examples/spine_mis_l4_l5_demo.json \
  examples/spine_mis_l4_l5_robotic_demo.json
```

You will see:
- Concepts A and B, both on the same procedural context
- Side-by-side metrics:
  - unit-op coverage
  - technical risk
  - workflow risk
  - economic risk
  - evidence strength
  - adoption risk load
- Adoption details (trajectory, barriers, leverage points) for A and B

This is useful for reasoning about manual vs robotic, low vs high capital, or any pair of innovation concepts.

---

## 5. Input Model (JSON Spec)

Each spec has two top-level blocks:
- `procedure`: which real-world procedure and context
- `tech_concept`: what is being added/changed

See:
- `examples/spine_mis_l4_l5_demo.json`
- `examples/spine_mis_l4_l5_robotic_demo.json`
- `examples/endo_colonoscopy_ai_demo.json`

for concrete templates.

---

## 6. Scope and Non-Claims

TSRFC does not:
- simulate tissue or biomechanics
- model reimbursement schedules
- predict clinical outcomes or cost-effectiveness
- replace trials, registries, or real-world data

It does:
- structure a procedure into unit operations
- surface plausible failure surfaces per category
- sketch evidence requirements (scale, centres, horizon)
- sketch adoption trajectories and friction points

All logic is deterministic and inspectable in:
- `tsrfc/models.py`
- `tsrfc/presets/__init__.py`
- `tsrfc/rules/*.py`
- `tsrfc/engine.py`

---

## 7. Minimal Command Summary

```bash
# Overview
tsrfc demo

# Discover procedures
tsrfc list-domains
tsrfc list-procedures
tsrfc list-procedures --domain spine

# Single concept
tsrfc check examples/spine_mis_l4_l5_demo.json
tsrfc check examples/endo_colonoscopy_ai_demo.json

# Compare two concepts
tsrfc compare examples/spine_mis_l4_l5_demo.json \
              examples/spine_mis_l4_l5_robotic_demo.json
```

This is all that is needed to explore the current v0 behaviour.






