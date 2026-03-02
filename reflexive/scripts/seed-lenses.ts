import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/db/client.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatesDir = join(__dirname, '../src/lenses/templates');

interface LensSeed {
  name: string;
  orientation: 'convergent' | 'divergent' | 'orthogonal';
  analytical_angle: string;
}

const lensSeeds: LensSeed[] = [
  {
    name: 'analytical',
    orientation: 'convergent',
    analytical_angle: 'Structured logical analysis. Identifies premises, inferences, conclusions.',
  },
  {
    name: 'adversarial',
    orientation: 'divergent',
    analytical_angle: 'Seeks weaknesses, counterarguments, failure modes.',
  },
  {
    name: 'historical_analogy',
    orientation: 'orthogonal',
    analytical_angle: 'Historical parallels. How similar situations resolved.',
  },
  {
    name: 'stakeholder_impact',
    orientation: 'orthogonal',
    analytical_angle: 'Maps affected parties. Differential impacts. Second-order effects.',
  },
  {
    name: 'premortem',
    orientation: 'divergent',
    analytical_angle: 'Assumes failure occurred. Reasons backward to likely causes.',
  },
];

async function seedLenses(): Promise<void> {
  try {
    for (const seed of lensSeeds) {
      const templatePath = join(templatesDir, `${seed.name}.txt`);
      const template = readFileSync(templatePath, 'utf-8');

      // Compute prompt hash (SHA-256 of template)
      const { createHash } = await import('crypto');
      const hash = createHash('sha256');
      hash.update(template);
      const prompt_hash = hash.digest('hex');

      // Insert or update lens
      await query(
        `INSERT INTO lenses (id, name, version, orientation, analytical_angle, prompt_hash, is_active, system_prompt_template)
         VALUES (gen_random_uuid(), $1, '1', $2, $3, $4, true, $5)
         ON CONFLICT (name, version) 
         DO UPDATE SET
           orientation = EXCLUDED.orientation,
           analytical_angle = EXCLUDED.analytical_angle,
           prompt_hash = EXCLUDED.prompt_hash,
           system_prompt_template = EXCLUDED.system_prompt_template,
           is_active = EXCLUDED.is_active`,
        [seed.name, seed.orientation, seed.analytical_angle, prompt_hash, template]
      );

      console.log(`✓ Seeded lens: ${seed.name}`);
    }

    console.log('\n✓ All lenses seeded');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
}

seedLenses();
