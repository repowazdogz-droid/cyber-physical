/**
 * Spec Compile API
 * 
 * Compiles a kernel spec and returns validation + preview.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateKernelSpec } from '../../../../spine/specs/SpecValidator';
import { compileAndRegisterSpec, getCompiledSpec } from '../../../../spine/specs/SpecKernelRunner';
import { KernelSpec } from '../../../../spine/specs/SpecTypes';

interface CompileRequest {
  spec: KernelSpec;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompileRequest = await request.json();
    const { spec } = body;

    if (!spec) {
      return NextResponse.json(
        { error: 'Spec is required' },
        { status: 400 }
      );
    }

    // Validate spec
    const validation = validateKernelSpec(spec);

    if (!validation.ok) {
      return NextResponse.json({
        ok: false,
        validation,
        compiledId: undefined,
        preview: undefined
      });
    }

    // Compile and register
    const compiledId = compileAndRegisterSpec(spec);

    // Generate preview (sample run with empty signals)
    const preview = {
      kernelId: spec.kernelId,
      adapterId: compiledId,
      name: spec.name,
      description: spec.description,
      outcomeCount: spec.outcomes.length,
      policyCount: spec.policies?.length || 0,
      overrideCount: spec.overrides?.length || 0,
      disallowCount: spec.disallows?.length || 0
    };

    return NextResponse.json({
      ok: true,
      validation,
      compiledId,
      preview
    });
  } catch (error: any) {
    console.error('Failed to compile spec:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compile spec' },
      { status: 500 }
    );
  }
}








































