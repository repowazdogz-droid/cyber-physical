import { Pool, QueryResult } from 'pg';
import { DATABASE_URL } from '../config.js';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
});

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  return pool.query(text, params);
}

export { pool };
