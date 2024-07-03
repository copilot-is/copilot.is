import { type Config } from 'drizzle-kit';

import { appConfig } from '@/lib/appconfig';

export default {
  schema: './server/db/schema.ts',
  driver: 'pg',
  dbCredentials: {
    connectionString: appConfig.db.url
  },
  tablesFilter: [appConfig.db.prefix + '*'],
  strict: true
} satisfies Config;
