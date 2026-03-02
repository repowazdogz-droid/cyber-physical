# OmegaStack Audit Quick Reference

**Date:** 2026-01-26  
**Artifacts Scanned:** 3,456  
**Reports Generated:** 4 files

## Report Files

1. **FINAL_AUDIT_REPORT_20260126.md** - Comprehensive audit report (285 lines)
2. **inventory_table_20260126.csv** - Machine-readable inventory (3,441 high-value items)
3. **inventory_20260126_072346.json** - Full inventory JSON (930KB)
4. **duplicates_families_20260126_072346.json** - Duplicate groups and FC families (962KB)
5. **migration_plan_20260126_072346.json** - Migration actions (691KB)

## Key Numbers

- **FC Families:** 3 (SRFC, TSRFC, VRFC)
- **Duplicate Groups:** 774
- **High-Value Items:** 3,441
- **Code Files:** ~850 (Python, TypeScript, Swift, Go)
- **Documentation:** ~200 markdown files

## Top-Level Structure

```
~/Omega/
├── srfc/          → SRFC feasibility compiler
├── tsrfc/         → TSRFC feasibility compiler  
├── vrfc/          → VRFC feasibility compiler
├── spine/         → Spine clinical translation system
├── omega-vision/  → iOS Swift XR platform (6 rooms)
├── app/           → Main Next.js application
├── examples/      → Clinical demo specs (spine, endoscopy)
├── oplas/         → Deterministic orchestration (v0 structure)
├── Docs/          → System documentation
└── Archive/       → Archived projects (2025-12 consolidation)
```

## Quick Actions

### Import to OmegaStack
- SRFC, TSRFC, VRFC (core FC tools)
- Spine system (clinical engine)
- Examples/*.json (demo content)
- OPLAS (orchestration)

### Review
- Multiple Next.js sites (consolidation?)
- omega-vision iOS integration strategy
- Legacy code directories

### Archive
- Archive/2025-12_consolidation
- _legacy directories
- Desktop screenshots

---

See FINAL_AUDIT_REPORT_20260126.md for complete details.


