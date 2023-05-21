import { drizzle } from 'drizzle-orm/planetscale-serverless'
import { connect } from '@planetscale/database'
import type { RequestEventAction, RequestEventLoader } from '@builder.io/qwik-city'

import * as schema from './schema'

type Fail = RequestEventLoader['fail']
type Env = RequestEventAction['env']

export const getDb = ({ env, fail }: { env: Env; fail?: Fail }) => {
  if (
    !env.get('DATABASE_HOST') ||
    !env.get('DATABASE_USERNAME') ||
    !env.get('DATABASE_PASSWORD')
  ) {
    if (fail) {
      fail(500, { errorMessage: 'Missing database config' })
    } else {
      throw new Error('Missing database config')
    }
  }

  const connection = connect({
    host: env.get('DATABASE_HOST') as string,
    username: env.get('DATABASE_USERNAME') as string,
    password: env.get('DATABASE_PASSWORD') as string,
  })

  return drizzle(connection, { schema, logger: env.get('NODE_ENV') === 'development' })
}
