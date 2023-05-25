import { component$ } from '@builder.io/qwik'
import { Image } from '@unpic/qwik'
import { HiHeartOutline, HiHeartSolid } from '@qwikest/icons/heroicons'
import { server$, z } from '@builder.io/qwik-city'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { and, eq } from 'drizzle-orm'

import { users, type PostWithUserAndLikeCount, likes } from '../../db/schema'
import { timeAgo } from '../../utils/dates'
import Button from '../Button'
import { getDb } from '../../db/db'
import { useAuthSession } from '../../routes/plugin@auth'
import { getIdFromToken } from '../../utils/getIdFromToken'

const likeInput = z.object({
  postId: z.number(),
  action: z.enum(['like', 'unlike']),
})

type LikeInput = z.infer<typeof likeInput>

export const like = server$(async function ({ postId, action }: LikeInput) {
  try {
    // Get id from session
    const userId = await getIdFromToken({ cookie: this.cookie, env: this.env })

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
    const db = getDb({ env: this.env })

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
})

interface Props {
  post: PostWithUserAndLikeCount
}

export default component$(({ post }: Props) => {
  const session = useAuthSession()

  return (
    <article class="relative flex border-b-[1px] bg-white hover:bg-stone-50 dark:bg-blue-1100 dark:hover:bg-blue-1000">
      {/* using a tag instead of Link because it was causing an error and also, */}
      {/* the docs says their internal testing found that using the <a> tag is snappier  */}
      <a href={`/${post.author?.username}`} class="absolute left-3 top-3">
        <Image
          src={post.author?.image ?? ''}
          alt="user avatar"
          layout="constrained"
          width={48}
          height={48}
          class="z-0 rounded-full"
        />
      </a>
      <a
        href={`/${post.author?.username}`}
        class="absolute left-[4.75rem] top-3 z-[1] flex w-[calc(100%-72px)]"
      >
        {post.author?.displayName && (
          <span class="mr-1 max-w-[38%] truncate break-words font-semibold hover:underline sm:max-w-[43%]">
            {post.author.displayName}
          </span>
        )}
        <span class="max-w-[38%] truncate break-words text-stone-500 dark:text-gray-400 sm:max-w-[43%]">
          @{post.author?.username}
        </span>
        <span class="dark:text-gray-400º px-1 text-stone-500">·</span>
        <span class="text-stone-500 dark:text-gray-400">{timeAgo(post.createdAt)}</span>
      </a>
      <a
        href={`/${post.author?.username}/status/${post.id}`}
        class="flex w-full p-3 pb-[2.5rem]"
      >
        {/* Placeholder for avatar */}
        <div class="min-h-[48px] min-w-[60px]" />
        <div class="flex w-[calc(100%-60px)] flex-col">
          {/* Placeholder for name and username */}
          <div class="flex opacity-0">
            {post.author?.displayName && (
              <span class="mr-1 max-w-[38%] truncate break-words font-semibold hover:underline sm:max-w-[43%]">
                {post.author.displayName}
              </span>
            )}
            <span class="max-w-[38%] truncate break-words text-stone-500 dark:text-gray-400 sm:max-w-[43%]">
              @{post.author?.username}
            </span>
            <span class="px-1 text-stone-500 dark:text-gray-400">·</span>
            <span class="text-stone-500 dark:text-gray-400">
              {timeAgo(post.createdAt)}
            </span>
          </div>
          <p class="w-full whitespace-pre-wrap break-words">{post.content}</p>
        </div>
      </a>
      <div
        class="group absolute bottom-[0.4rem] left-[4.25rem] flex cursor-pointer items-center"
        onClick$={async () => {
          if (!session.value?.user) return

          if (post.userLiked) {
            // optimistic update
            post.userLiked = 0
            post.likeCount = (parseInt(post.likeCount) - 1).toString()

            // send request to server
            const likeAction = await like({ postId: post.id, action: 'unlike' })

            if (likeAction.code !== 200) {
              // revert optimistic update
              post.userLiked = 1
              post.likeCount = (parseInt(post.likeCount) + 1).toString()
            }
          } else {
            // optimistic update
            post.userLiked = 1
            post.likeCount = (parseInt(post.likeCount) + 1).toString()

            // send request to server
            const likeAction = await like({ postId: post.id, action: 'like' })

            if (likeAction.code !== 200) {
              // revert optimistic update
              post.userLiked = 0
              post.likeCount = (parseInt(post.likeCount) - 1).toString()
            }
          }
        }}
      >
        <Button
          variant="ghost"
          aria-label="Like"
          class={`pointer-events-none h-8 w-8 items-center justify-center text-xl ${
            post.userLiked
              ? 'text-pink-500 dark:text-pink-600'
              : 'text-stone-500 dark:text-gray-400'
          } group-hover:bg-pink-500 group-hover:bg-opacity-[0.15] group-hover:text-pink-500 group-hover:dark:text-pink-600`}
        >
          {post.userLiked ? <HiHeartSolid /> : <HiHeartOutline class="stroke-2" />}
        </Button>
        <span
          class={`pl-1 pr-3 text-sm ${
            post.userLiked
              ? 'text-pink-500 dark:text-pink-600'
              : 'text-stone-500 dark:text-gray-400'
          } group-hover:text-pink-500 group-hover:dark:text-pink-600`}
        >
          {post.likeCount}
        </span>
      </div>
    </article>
  )
})
