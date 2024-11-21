import { neon } from '@neondatabase/serverless';
import { sql } from '@vercel/postgres';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-http';
import { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as vercelDrizzle } from 'drizzle-orm/vercel-postgres';

import { appConfig } from '@/lib/appconfig';

import * as schema from './schema';

const createDb = () => {
  if (appConfig.db.provider === 'neon') {
    return neonDrizzle(neon(appConfig.db.url!), { schema });
  }
  return vercelDrizzle(sql, { schema });
};

export const db = createDb() as PgDatabase<PgQueryResultHKT, typeof schema>;
