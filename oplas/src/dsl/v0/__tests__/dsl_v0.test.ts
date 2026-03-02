/**
 * DSL v0 Tests
 * 
 * Contract tests for DSL v0 parsing, formatting, and canonicalization.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseDSL } from '../Parser';
import { formatDSL } from '../Formatter';
import { canonicalizeAST } from '../Canonicalizer';
import { validateFrame } from '../FrameValidator';
import { buildProgram } from '../ProgramBuilder';
import { FrameMode } from '../../../contracts/enums/FrameModes';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';

function loadFixture(name: string): string {
  const path = join(process.cwd(), 'fixtures', 'programs', `${name}.txt`);
  return readFileSync(path, 'utf8').trim();
}

describe('DSL v0 Parser', () => {
  it('should parse simple recolor program', () => {
    const source = loadFixture('01_simple_recolor');
    const result = parseDSL(source);

    expect(result.ok).toBe(true);
    expect(result.ast).toBeDefined();
    expect(result.declared_frame).toBe(FrameMode.RELATIVE);
  });

  it('should parse program with frame declaration', () => {
    const source = loadFixture('05_paste_absolute');
    const result = parseDSL(source);

    expect(result.ok).toBe(true);
    expect(result.declared_frame).toBe(FrameMode.ABSOLUTE);
  });

  it('should parse nested let expressions', () => {
    const source = loadFixture('06_nested_let');
    const result = parseDSL(source);

    expect(result.ok).toBe(true);
    expect(result.ast?.type).toBe('Seq');
  });

  it('should parse objset literals', () => {
    const source = loadFixture('10_objset_literal');
    const result = parseDSL(source);

    expect(result.ok).toBe(true);
  });
});

describe('DSL v0 Round-Trip', () => {
  const fixtures = [
    '01_simple_recolor',
    '02_select_and_recolor',
    '03_crop_relative',
    '04_paste_relative',
    '05_paste_absolute',
    '06_nested_let',
    '07_multiple_ops',
    '08_coord_rel_top_left',
    '09_coord_rel_bottom_right',
    '10_objset_literal',
    '11_int_literals',
    '12_bool_literal',
    '13_var_reference',
    '14_chained_operations',
    '17_empty_seq',
    '18_single_op',
    '19_complex_pipeline'
  ];

  fixtures.forEach(fixtureName => {
    it(`should round-trip ${fixtureName}`, () => {
      const source1 = loadFixture(fixtureName);
      const parse1 = parseDSL(source1);
      
      expect(parse1.ok).toBe(true);
      if (!parse1.ast || !parse1.declared_frame) return;

      const formatted = formatDSL(parse1.ast, parse1.declared_frame);
      const parse2 = parseDSL(formatted);

      expect(parse2.ok).toBe(true);
      if (!parse2.ast || !parse2.declared_frame) return;

      // Structural equality (simplified)
      expect(parse2.ast.type).toBe(parse1.ast.type);
      expect(parse2.declared_frame).toBe(parse1.declared_frame);
    });
  });
});

describe('DSL v0 Canonical Hash Stability', () => {
  it('should produce stable hash for same program', () => {
    const source = loadFixture('01_simple_recolor');
    const parse1 = parseDSL(source);
    const parse2 = parseDSL(source);

    expect(parse1.ok).toBe(true);
    expect(parse2.ok).toBe(true);
    if (!parse1.ast || !parse1.declared_frame || !parse2.ast || !parse2.declared_frame) return;

    const build1 = buildProgram(parse1.ast, parse1.declared_frame);
    const build2 = buildProgram(parse2.ast, parse2.declared_frame);

    expect(build1.ok).toBe(true);
    expect(build2.ok).toBe(true);
    expect(build1.program?.program_id).toBe(build2.program?.program_id);
  });

  it('should produce stable hash across canonicalization', () => {
    const source = loadFixture('19_complex_pipeline');
    const parse1 = parseDSL(source);
    
    expect(parse1.ok).toBe(true);
    if (!parse1.ast || !parse1.declared_frame) return;

    const canonical1 = canonicalizeAST(parse1.ast);
    const canonical2 = canonicalizeAST(parse1.ast);

    const hash1 = hashCanonical(canonical1);
    const hash2 = hashCanonical(canonical2);

    expect(hash1).toBe(hash2);
  });
});

describe('DSL v0 Frame Rules', () => {
  it('should reject CoordAbs under RELATIVE frame', () => {
    const source = loadFixture('15_absolute_frame_error');
    const parse = parseDSL(source);

    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const validation = validateFrame(parse.ast, parse.declared_frame);
    expect(validation.ok).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.abs_coord_refs).toBe(1);
  });

  it('should allow CoordAbs under ABSOLUTE frame', () => {
    const source = loadFixture('05_paste_absolute');
    const parse = parseDSL(source);

    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const validation = validateFrame(parse.ast, parse.declared_frame);
    expect(validation.ok).toBe(true);
    expect(validation.abs_coord_refs).toBe(1);
  });

  it('should allow CoordRel under RELATIVE frame', () => {
    const source = loadFixture('04_paste_relative');
    const parse = parseDSL(source);

    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const validation = validateFrame(parse.ast, parse.declared_frame);
    expect(validation.ok).toBe(true);
    expect(validation.abs_coord_refs).toBe(0);
  });

  it('should allow CoordRel under ABSOLUTE frame', () => {
    const source = loadFixture('16_relative_coord_in_absolute');
    const parse = parseDSL(source);

    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const validation = validateFrame(parse.ast, parse.declared_frame);
    expect(validation.ok).toBe(true);
  });
});

describe('DSL v0 Deterministic Formatting', () => {
  it('should format consistently', () => {
    const source = loadFixture('02_select_and_recolor');
    const parse1 = parseDSL(source);
    const parse2 = parseDSL(source);

    expect(parse1.ok).toBe(true);
    expect(parse2.ok).toBe(true);
    if (!parse1.ast || !parse1.declared_frame || !parse2.ast || !parse2.declared_frame) return;

    const formatted1 = formatDSL(parse1.ast, parse1.declared_frame);
    const formatted2 = formatDSL(parse2.ast, parse2.declared_frame);

    expect(formatted1).toBe(formatted2);
  });
});

describe('DSL v0 Program Building', () => {
  it('should build program with stable program_id', () => {
    const source = loadFixture('01_simple_recolor');
    const parse = parseDSL(source);

    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build1 = buildProgram(parse.ast, parse.declared_frame);
    const build2 = buildProgram(parse.ast, parse.declared_frame);

    expect(build1.ok).toBe(true);
    expect(build2.ok).toBe(true);
    expect(build1.program?.program_id).toBe(build2.program?.program_id);
  });

  it('should reject program with frame violation', () => {
    const source = loadFixture('15_absolute_frame_error');
    const parse = parseDSL(source);

    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(false);
    expect(build.errors.length).toBeGreaterThan(0);
  });
});























