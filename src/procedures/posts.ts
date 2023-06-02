import { type RequestEventBase, type RequestEventLoader, z } from '@builder.io/qwik-city'
import { sql, desc, eq, and, isNull } from 'drizzle-orm'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { getDb } from '../db/db'
import { likes, posts, users } from '../db/schema'
import { getIdFromToken } from '../utils/getIdFromToken'
import type { ResolvedType } from '../utils/tsHelpers'

// ---------
// Parameters
// ---------

const getManyParams = z.object({
  offset: z.number().optional(),
  userId: z.number().optional(),
  replyToPostId: z.number().optional(),
  noReplies: z.boolean().optional(),
})
export type GetManyPostsParams = z.infer<typeof getManyParams>

const getByIdParams = z.object({
  id: z.number(),
})
export type GetPostByIdParams = z.infer<typeof getByIdParams>

// ------------
// Inputs
// ------------

const addPostInput = z.object({
  content: z.string(),
  replyToPostId: z.number().optional(),
})
export type AddPostInput = z.infer<typeof addPostInput>

// ------------
// Procedures
// ------------

export const postsProcedures = ({
  cookie,
  env,
}: RequestEventLoader | RequestEventBase) => {
  return {
    // ------------
    // Queries
    // ------------
    query: {
      // ------------
      // Get many posts
      // ------------
      getMany: async ({
        offset,
        userId,
        noReplies,
        replyToPostId,
      }: GetManyPostsParams) => {
        try {
          // Get user id from session token
          const sessionUserId = await getIdFromToken({ cookie, env })

          const db = getDb({ env })

          const queryPosts = await db.query.posts.findMany({
            where: and(
              userId ? eq(posts.userId, userId) : undefined,
              noReplies ? isNull(posts.replyToPostId) : undefined,
              replyToPostId ? eq(posts.replyToPostId, replyToPostId) : undefined
            ),
            with: { author: true },
            extras: {
              likeCount:
                sql<string>`(SELECT COUNT(*) FROM ${likes} WHERE likes.post_id = ${posts.id})`.as(
                  'like_count'
                ),
              replyCount:
                sql<string>`(SELECT COUNT(*) FROM ${posts} r WHERE r.reply_to_post_id = ${posts.id})`.as(
                  'reply_count'
                ),
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
      },
      // ------------
      // Get post by id
      // ------------
      getById: async ({ id }: GetPostByIdParams) => {
        try {
          // Get user id from session token
          const userId = await getIdFromToken({ cookie, env })

          const db = getDb({ env })

          if (isNaN(id)) return { code: 400, message: 'Invalid post id', data: null }

          const post = await db.query.posts.findFirst({
            where: eq(posts.id, id),
            with: { author: true },
            extras: {
              likeCount:
                sql<string>`(SELECT COUNT(*) FROM ${likes} WHERE likes.post_id = ${id})`.as(
                  'like_count'
                ),
              replyCount:
                sql<string>`(SELECT COUNT(*) FROM ${posts} WHERE posts.reply_to_post_id = ${id})`.as(
                  'reply_count'
                ),
              userLiked: userId
                ? sql<
                    0 | 1
                  >`EXISTS (SELECT 1 FROM ${likes} WHERE likes.post_id = ${id} AND likes.user_id = ${userId})`.as(
                    'user_liked'
                  )
                : sql<0 | 1>`0`.as('user_liked'),
            },
          })

          if (!post) return { code: 404, message: 'Qweek not found', data: null }

          return { code: 200, message: 'success', data: post }
        } catch (error) {
          let message = 'Oops, something went wrong. Please try again later.'

          if (error instanceof Error) message = error.message

          return { code: 500, message, data: null }
        }
      },
    },
    // ------------
    // Mutations
    // ------------
    mutation: {
      // ------------
      // Add post
      // ------------
      add: async ({ content, replyToPostId }: AddPostInput) => {
        try {
          // Get id from session
          const userId = await getIdFromToken({ cookie, env })

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
          const db = getDb({ env })

          const user = await db.query.users.findFirst({ where: eq(users.id, userId) })

          if (!user) return { code: 401, message: 'Unauthorized', data: null }

          // Insert and return new post
          const newPostQuery = await db
            .insert(posts)
            .values({ content, userId: user.id, replyToPostId })

          const newPost = await db.query.posts.findFirst({
            where: eq(posts.id, parseInt(newPostQuery.insertId)),
            with: { author: true },
            extras: {
              likeCount: sql<string>`0`.as('like_count'),
              replyCount: sql<string>`0`.as('reply_count'),
              userLiked: sql<0>`0`.as('user_liked'),
            },
          })

          return { code: 200, message: 'success', data: newPost }
        } catch (error) {
          let message = 'Oops, something went wrong. Please try again later.'

          if (error instanceof Error) message = error.message

          return { code: 500, message, data: null }
        }
      },
    },
  }
}

// ------------
// Return types
// ------------

// Get many posts
type GetManyPostsPromise = ReturnType<
  ReturnType<typeof postsProcedures>['query']['getMany']
>
export type GetManyPosts = Exclude<ResolvedType<GetManyPostsPromise>['data'], null>

// Get post by id
type GetPostByIdPromise = ReturnType<
  ReturnType<typeof postsProcedures>['query']['getById']
>

export type GetPostById = Exclude<ResolvedType<GetPostByIdPromise>['data'], null>
