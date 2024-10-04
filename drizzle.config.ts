import { type Config } from 'drizzle-kit';

import { appConfig } from '@/lib/appconfig';

export default {
  schema: './server/db/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: appConfig.db.url
  },
  tablesFilter: [appConfig.db.prefix + '*']
} satisfies Config;
