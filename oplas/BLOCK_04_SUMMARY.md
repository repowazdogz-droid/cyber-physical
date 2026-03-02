# Block 04 — DSL Spec (v0) + Canonical AST + Round-Trip — COMPLETE

## Status: ✅ Complete

Block 04 defines a tiny, typed DSL for grid_2d transformations with canonical AST, round-trip parsing/formatting, and frame enforcement.

## Components Implemented

### 1. DSL v0 Types (`src/dsl/v0/types.ts`)

- **DSLType**: Type system (Grid, Repr, Mask, ObjSet, Color, CoordRel, CoordAbs, Int, Bool)
- **CoordRel**: Relative coordinate with anchor and offsets
- **CoordAbs**: Absolute coordinate
- **Expr**: Expression AST nodes (Seq, Op, Let, Var, Literal)
- **Program**: Complete program structure

### 2. DSL Grammar (`src/dsl/v0/grammar.ts`)

- **DSL_GRAMMAR_VERSION**: Grammar version (1.0.0)
- **OPERATOR_SIGNATURES**: Operator type signatures
- **ALLOWED_OPERATORS**: 5 operators (select_components, mask_from_objects, recolor, crop_to_bbox, paste_at)

### 3. Parser (`src/dsl/v0/Parser.ts`)

- **parseDSL()**: Parses s-expression DSL source into AST
- Tokenizes source
- Parses program header with frame declaration
- Parses expressions (Seq, Op, Let, Var, Literal)
- Handles all literal types (int, bool, coord_rel, coord_abs, objset)

### 4. Formatter (`src/dsl/v0/Formatter.ts`)

- **formatDSL()**: Formats AST into canonical DSL source
- Round-trip invariant: `format(parse(source)) == canonical_source`
- Deterministic formatting (no whitespace drift)

### 5. Canonicalizer (`src/dsl/v0/Canonicalizer.ts`)

- **canonicalizeAST()**: Canonicalizes AST for stable hashing
- Sorts object sets
- Normalizes coordinate structures
- Ensures deterministic encoding

### 6. Frame Validator (`src/dsl/v0/FrameValidator.ts`)

- **validateFrame()**: Validates frame rules
- Rejects CoordAbs under RELATIVE frame
- Counts abs_coord_refs metric
- Returns validation errors

### 7. Program Builder (`src/dsl/v0/ProgramBuilder.ts`)

- **buildProgram()**: Builds complete Program structure
- Canonicalizes AST
- Validates frame rules
- Formats canonical source
- Computes program_id (hash of canonical AST)

### 8. Fixtures (`fixtures/programs/`)

20 program fixtures covering:
- Simple operations
- Nested let expressions
- Multiple operations
- Coordinate types (relative, absolute)
- Frame rules (errors and valid cases)
- Complex pipelines
- Edge cases (empty seq, single op)

### 9. Tests (`src/dsl/v0/__tests__/dsl_v0.test.ts`)

Contract tests:
- Parser tests (all fixtures)
- Round-trip property (20 fixtures)
- Canonical hash stability
- Frame rule enforcement
- Deterministic formatting
- Program building

## DSL v0 Operators (5)

1. **select_components(repr, predicate) -> ObjSet**
   - Selects components from representation based on predicate

2. **mask_from_objects(repr, objs) -> Mask**
   - Creates mask from object set

3. **recolor(grid, mask, from:Color?, to:Color) -> Grid**
   - Recolors masked cells

4. **crop_to_bbox(grid, objs | mask) -> Grid**
   - Crops grid to bounding box of objects/mask

5. **paste_at(base:Grid, patch:Grid, at:CoordRel|CoordAbs) -> Grid**
   - Pastes patch at coordinate

## Frame Enforcement

- **RELATIVE**: Default frame mode; CoordAbs literals are schema errors
- **ABSOLUTE**: Explicit frame mode; allows CoordAbs; records abs_coord_refs metric
- Frame validation enforced in ProgramBuilder

## Canonical AST Format

- `program_id`: Hash of canonical AST bytes
- `dsl_grammar_version`: Grammar version
- `declared_frame`: RELATIVE | ABSOLUTE
- `dsl_source`: Canonical formatted source
- `ast`: Canonicalized AST

## Round-Trip Guarantees

✅ **Parse → Format**: `format(parse(source)) == canonical_source`  
✅ **Format → Parse**: `parse(format(AST)) == AST` (structural equality)  
✅ **Hash Stability**: Same AST → same program_id  
✅ **Deterministic Formatting**: No whitespace drift

## Definition of Done

✅ **DSL grammar v0 frozen** (documented)  
✅ **AST schema implemented** + validated  
✅ **Canonical formatter implemented**  
✅ **Program hashing stable** and tested  
✅ **20 fixtures**: Small programs exercising each operator + frame rules  
✅ **Contract tests pass**: Round-trip, hash stability, frame rules, deterministic formatting

## Files Created

```
oplas/src/dsl/v0/
├── types.ts
├── grammar.ts
├── Parser.ts
├── Formatter.ts
├── Canonicalizer.ts
├── FrameValidator.ts
├── ProgramBuilder.ts
├── index.ts
└── __tests__/
    └── dsl_v0.test.ts

oplas/fixtures/programs/
├── 01_simple_recolor.txt
├── 02_select_and_recolor.txt
├── 03_crop_relative.txt
├── 04_paste_relative.txt
├── 05_paste_absolute.txt
├── 06_nested_let.txt
├── 07_multiple_ops.txt
├── 08_coord_rel_top_left.txt
├── 09_coord_rel_bottom_right.txt
├── 10_objset_literal.txt
├── 11_int_literals.txt
├── 12_bool_literal.txt
├── 13_var_reference.txt
├── 14_chained_operations.txt
├── 15_absolute_frame_error.txt
├── 16_relative_coord_in_absolute.txt
├── 17_empty_seq.txt
├── 18_single_op.txt
├── 19_complex_pipeline.txt
└── 20_mixed_coords.txt
```

## Usage

### Parse DSL
```typescript
import { parseDSL } from './src/dsl/v0';

const result = parseDSL('(program (seq (recolor grid mask 0 1)))');
if (result.ok) {
  console.log(result.ast);
  console.log(result.declared_frame);
}
```

### Build Program
```typescript
import { parseDSL, buildProgram } from './src/dsl/v0';

const parse = parseDSL(source);
if (parse.ok && parse.ast && parse.declared_frame) {
  const build = buildProgram(parse.ast, parse.declared_frame);
  if (build.ok && build.program) {
    console.log(build.program.program_id);
  }
}
```

## Next Steps

**Block 05**: Executor (runtime + sandbox)























