import { defineConfig } from 'drizzle-kit';

import { appConfig } from '@/lib/appconfig';

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: appConfig.db.url
  },
  migrations: {
    table: '__drizzle_migrations',
    schema: 'public'
  }
});
