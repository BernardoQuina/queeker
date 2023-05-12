import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { connect } from '@planetscale/database'

import { type RequestEventLoader } from '@builder.io/qwik-city'

export const getDb = ({ env, fail }: RequestEventLoader) => {
  if (
    !env.get('DATABASE_HOST') ||
    !env.get('DATABASE_USERNAME') ||
    !env.get('DATABASE_PASSWORD')
  ) {
    fail(500, { errorMessage: 'Missing database config' })
  }

  const connection = connect({
    host: env.get('DATABASE_HOST') as string,
    username: env.get('DATABASE_USERNAME') as string,
    password: env.get('DATABASE_PASSWORD') as string,
  })

  return drizzle(connection, { logger: env.get('NODE_ENV') === 'development' })
}
