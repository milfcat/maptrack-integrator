import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.POSTGRES_URL;
    if (!url) {
      throw new Error(
        'POSTGRES_URL environment variable is not set. Configure it in .env.local or Vercel.'
      );
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// Convenience export — lazy initialized via proxy
export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_, prop) {
      return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);
