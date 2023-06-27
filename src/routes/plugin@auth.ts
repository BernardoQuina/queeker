import { serverAuth$ } from '@builder.io/qwik-auth'
import GitHub from '@auth/core/providers/github'
import type { Provider } from '@auth/core/providers'

import { api } from '../api'

export const { onRequest, useAuthSession, useAuthSignin, useAuthSignout } = serverAuth$(
  (req) => ({
    secret: req.env.get('AUTH_SECRET'),
    trustHost: true,
    providers: [
      GitHub({
        clientId: req.env.get('GITHUB_ID') as string,
        clientSecret: req.env.get('GITHUB_SECRET') as string,
        profile: async (profile) => {
          const userRes = await api(req).users.query.getByUsername({
            username: profile.login.toLowerCase(),
          })

          let userId = userRes.data?.user.id

          if (!userRes.data?.user) {
            const createUser = await api(req).users.mutations.create({
              username: profile.login,
              displayName: profile.name,
              image: profile.avatar_url,
            })

            if (createUser.code !== 200 || !createUser.data) {
              throw new Error(createUser.message)
            }

            userId = createUser.data.userId
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
