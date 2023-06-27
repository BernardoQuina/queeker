import type { Config } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default {
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  driver: 'mysql2',
  breakpoints: true,
  dbCredentials: { connectionString: process.env.DATABASE_URL || '' },
} satisfies Config
