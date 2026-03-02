/**
 * Fixtures Runner
 * 
 * Loads DSL programs from fixtures directory.
 * 
 * Version: 1.0.0
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { parseDSL, buildProgram } from '../../dsl/v0';
import { Program } from '../../dsl/v0/types';

/**
 * Loads programs from fixtures directory.
 */
export async function loadProgramsFromFixtures(fixturesDir: string): Promise<Program[]> {
  const programs: Program[] = [];

  try {
    const files = await readdir(fixturesDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    for (const file of txtFiles) {
      const filePath = join(fixturesDir, file);
      const source = await readFile(filePath, 'utf8');

      const parse = parseDSL(source.trim());
      if (!parse.ok || !parse.ast || !parse.declared_frame) {
        continue; // Skip invalid programs
      }

      const build = buildProgram(parse.ast, parse.declared_frame);
      if (!build.ok || !build.program) {
        continue; // Skip programs with build errors
      }

      programs.push(build.program);
    }
  } catch (error) {
    // Directory doesn't exist or other error
    return [];
  }

  return programs;
}























