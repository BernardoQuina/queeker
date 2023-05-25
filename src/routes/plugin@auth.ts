import { serverAuth$ } from '@builder.io/qwik-auth'
import GitHub from '@auth/core/providers/github'
import type { Provider } from '@auth/core/providers'
import { eq } from 'drizzle-orm'

import { getDb } from '../db/db'
import { users } from '../db/schema'

export const { onRequest, useAuthSession, useAuthSignin, useAuthSignout } = serverAuth$(
  ({ env }) => ({
    secret: env.get('AUTH_SECRET'),
    trustHost: true,
    providers: [
      GitHub({
        clientId: env.get('GITHUB_ID') as string,
        clientSecret: env.get('GITHUB_SECRET') as string,
        profile: async (profile) => {
          const db = getDb({ env })

          const user = await db.query.users.findFirst({
            where: eq(users.username, profile.login.toLowerCase()),
          })

          let userId = user?.id

          if (!user) {
            const createUser = await db.insert(users).values({
              username: profile.login.toLowerCase(),
              displayName: profile.name,
              image: profile.avatar_url,
            })

            userId = parseInt(createUser.insertId)
          }

          return {
            id: profile.id.toString(), // this is not being returned in the session 🫥
            // And I can't add additional fields so I'm combining name and login into one field
            name: `${
              profile.name
            }github_handle:${profile.login.toLowerCase()}db_id:${userId}`,
            image: profile.avatar_url,
          }
        },
      }),
    ] as Provider[],
  })
)
