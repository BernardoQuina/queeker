import { server$, z } from '@builder.io/qwik-city'
import { sql, desc, eq } from 'drizzle-orm'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { getDb } from '../db/db'
import { likes, posts, users } from '../db/schema'
import { getIdFromToken } from '../utils/getIdFromToken'

const postsQueryParams = z.object({
  offset: z.number().optional().default(0),
  userId: z.number().optional(),
})

type PostsQueryParams = z.infer<typeof postsQueryParams>

export const postsQuery = server$(async function ({ offset, userId }: PostsQueryParams) {
  try {
    // Get user id from session token
    const sessionUserId = await getIdFromToken({ cookie: this.cookie, env: this.env })

    const db = getDb({ env: this.env })

    const queryPosts = await db.query.posts.findMany({
      where: userId ? eq(posts.userId, userId) : undefined,
      with: { author: true, likes: { columns: {} } },
      extras: {
        likeCount: sql<string>`COUNT(posts_likes.id)`.as('like_count'),
        userLiked: sessionUserId
          ? sql<
              0 | 1
            >`EXISTS (SELECT 1 FROM ${likes} WHERE likes.post_id = ${posts.id} AND likes.user_id = ${sessionUserId})`.as(
              'user_liked'
            )
          : sql<0 | 1>`0`.as('user_liked'),
      },
      limit: 25,
      offset,
      orderBy: desc(posts.createdAt),
    })

    return { code: 200, message: 'success', data: queryPosts }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})

const addPostInput = z.object({
  content: z.string(),
})

type AddPostInput = z.infer<typeof addPostInput>

export const addPostMutation = server$(async function (post: AddPostInput) {
  try {
    // Get id from session
    const userId = await getIdFromToken({ cookie: this.cookie, env: this.env })

    if (!userId) return { code: 401, message: 'Unauthorized', data: null }

    // Rate limit
    const rateLimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(2, '30 s'),
      analytics: true,
    })

    const { success } = await rateLimit.limit(userId.toString())

    if (!success) return { code: 429, message: 'Too many requests', data: null }

    // Get user
    const db = getDb({ env: this.env })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

    if (!user) return { code: 401, message: 'Unauthorized', data: null }

    // Insert and return new post
    const newPostQuery = await db
      .insert(posts)
      .values({ content: post.content, userId: user.id })

    const newPost = await db.query.posts.findFirst({
      where: eq(posts.id, parseInt(newPostQuery.insertId)),
      with: { author: true, likes: { columns: {} } },
      extras: {
        likeCount: sql<string>`0`.as('like_count'),
        userLiked: sql<0>`0`.as('user_liked'),
      },
    })

    return { code: 200, message: 'success', data: newPost }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})
