import { defineConfig } from 'drizzle-kit';

import { env } from '@/lib/env';

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.POSTGRES_URL
  },
  migrations: {
    table: 'drizzle_migrations',
    schema: 'public'
  }
});
