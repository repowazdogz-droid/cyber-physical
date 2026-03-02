/**
 * Instantiator
 * 
 * Instantiates concept templates to concrete programs.
 * 
 * Version: 1.0.0
 */

import { ConceptCard } from '../../contracts/types/ConceptCard';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { Program } from '../../dsl/v0/types';
import { ConceptInstantiationResult } from './types';
import { parseDSL, buildProgram } from '../../dsl/v0';
import { FrameMode } from '../../contracts/enums/FrameModes';

/**
 * Instantiates a concept template to a concrete program.
 * 
 * v0: Simple instantiation
 * - fill defaults
 * - optionally bind obvious params from repr/request
 * - output concrete program.dsl
 */
export function instantiateConcept(
  concept: ConceptCard,
  repr: CanonicalRepresentation,
  request: Request
): ConceptInstantiationResult {
  const errors: string[] = [];

  // Get template DSL
  const templateDsl = concept.template.template_dsl;
  const params = concept.template.params || [];

  // Simple parameter substitution (v0: minimal)
  let dslSource = templateDsl;

  // Extract colors from repr (if needed)
  const colors = new Set<number>();
  for (const node of repr.nodes) {
    if (node.attrs.color !== undefined) {
      colors.add(node.attrs.color as number);
    }
  }
  const colorArray = Array.from(colors).sort();

  // Replace parameter placeholders (simple string substitution)
  for (const param of params) {
    if (param.startsWith('color_')) {
      // Use first available color or default
      const colorValue = colorArray.length > 0 ? colorArray[0] : 0;
      dslSource = dslSource.replace(new RegExp(`\\$\\{${param}\\}`, 'g'), colorValue.toString());
    } else if (param === 'default') {
      // Use default value (0 for numbers, false for bools)
      dslSource = dslSource.replace(new RegExp(`\\$\\{${param}\\}`, 'g'), '0');
    }
    // Add more parameter types as needed
  }

  // Parse DSL
  const parse = parseDSL(dslSource.trim());
  if (!parse.ok || !parse.ast || !parse.declared_frame) {
    errors.push(`Failed to parse instantiated DSL: ${parse.error || 'Unknown error'}`);
    return {
      ok: false,
      errors
    };
  }

  // Build program
  const build = buildProgram(parse.ast, parse.declared_frame);
  if (!build.ok || !build.program) {
    errors.push(`Failed to build program: ${build.errors.join(', ')}`);
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    program: build.program,
    concept
  };
}























