import { type RequestEventLoader, type RequestEventBase, z } from '@builder.io/qwik-city'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { and, eq } from 'drizzle-orm'

import { getIdFromToken } from '../utils/getIdFromToken'
import { getDb } from '../db/db'
import { likes, users } from '../db/schema'

const likeInput = z.object({
  postId: z.number(),
  action: z.enum(['like', 'unlike']),
})

export type LikeInput = z.infer<typeof likeInput>

export const likesApi = ({ env, cookie }: RequestEventLoader | RequestEventBase) => {
  return {
    mutation: {
      like: async ({ postId, action }: LikeInput) => {
        try {
          // Get id from session
          const userId = await getIdFromToken({ cookie, env })

          if (!userId) return { code: 401, message: 'Unauthorized', data: null }

          // Rate limit
          const rateLimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(4, '10 s'),
            analytics: true,
          })

          const { success } = await rateLimit.limit(userId.toString())

          if (!success) return { code: 429, message: 'Too many requests', data: null }

          // Get user
          const db = getDb({ env })

          const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

          if (!user) return { code: 401, message: 'Unauthorized', data: null }

          // Check if user has already liked post
          const like = await db.query.likes.findFirst({
            where: (table) => and(eq(table.postId, postId), eq(table.userId, user.id)),
          })

          if (action === 'like') {
            if (like) return { code: 200, message: 'success', data: null }

            await db.insert(likes).values({ postId, userId: user.id })

            return { code: 200, message: 'success', data: null }
          } else {
            if (!like) return { code: 200, message: 'success', data: null }

            await db
              .delete(likes)
              .where(and(eq(likes.postId, postId), eq(likes.userId, user.id)))

            return { code: 200, message: 'success', data: null }
          }
        } catch (error) {
          let message = 'Oops, something went wrong. Please try again later.'

          if (error instanceof Error) message = error.message

          return { code: 500, message, data: null }
        }
      },
    },
  }
}
