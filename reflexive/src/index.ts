import './config.js';
import { query } from './db/client.js';
import { loadActiveLenses } from './lenses/registry.js';

async function main(): Promise<void> {
  try {
    // Test database connection
    await query('SELECT 1');

    // Load active lenses
    const lenses = await loadActiveLenses();

    console.log(`REFLEXIVE ready. ${lenses.length} active lenses loaded.`);
    console.log('Lenses:', lenses.map((l) => l.name).join(', '));
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

main();
