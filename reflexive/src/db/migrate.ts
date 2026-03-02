import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsDir = join(__dirname, '../../migrations');

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await query('SELECT name FROM _migrations');
  return new Set(result.rows.map((row) => row.name));
}

async function applyMigration(name: string, sql: string): Promise<void> {
  await query('BEGIN');
  try {
    await query(sql);
    await query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
    await query('COMMIT');
    console.log(`✓ Applied migration: ${name}`);
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      if (applied.has(file)) {
        console.log(`⊘ Skipping already applied: ${file}`);
        continue;
      }

      const sqlPath = join(migrationsDir, file);
      const sql = await readFile(sqlPath, 'utf-8');
      await applyMigration(file, sql);
    }

    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();
