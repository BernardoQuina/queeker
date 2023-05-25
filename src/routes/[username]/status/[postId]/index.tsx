import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$, useLocation } from '@builder.io/qwik-city'
import { eq, sql } from 'drizzle-orm'
import { HiHeartOutline, HiHeartSolid } from '@qwikest/icons/heroicons'

import { likes, posts } from '../../../../db/schema'
import { getDb } from '../../../../db/db'
import ErrorMessage from '../../../../components/ErrorMessage'
import Header from '../../../../components/post/Header'
import { formatDate } from '../../../../utils/dates'
import { getIdFromToken } from '../../../../utils/getIdFromToken'
import { useAuthSession } from '../../../plugin@auth'
import Button from '../../../../components/Button'
import { likeMutation } from '../../../../procedures/likes'

export const usePost = routeLoader$(async (reqEvent) => {
  try {
    // Get user id from session token
    const userId = await getIdFromToken({ cookie: reqEvent.cookie, env: reqEvent.env })

    const db = getDb(reqEvent)

    const postId = parseInt(reqEvent.params.postId)

    if (isNaN(postId)) return { code: 400, message: 'Invalid post id', data: null }

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: { author: true, likes: { columns: {} } },
      extras: {
        likeCount: sql<string>`COUNT(posts_likes.id)`.as('like_count'),
        userLiked: userId
          ? sql<
              0 | 1
            >`EXISTS (SELECT 1 FROM ${likes} WHERE likes.post_id = ${posts.id} AND likes.user_id = ${userId})`.as(
              'user_liked'
            )
          : sql<0 | 1>`0`.as('user_liked'),
      },
    })

    if (!post) return { code: 404, message: 'Qweek not found', data: null }

    return { code: 200, message: 'success', data: { post } }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})

export default component$(() => {
  const postSignal = usePost()

  const post = useStore(postSignal.value.data?.post ?? { notFound: true })

  const location = useLocation()

  const session = useAuthSession()

  return (
    <div class="w-[600px] max-w-full flex-grow self-center border-l-[1px] border-r-[1px]">
      {'notFound' in post || postSignal.value.code !== 200 ? (
        <ErrorMessage
          message={postSignal.value.message}
          retryHref={location.url.pathname}
        />
      ) : (
        <>
          <Header user={post.author} />
          <section class="border-b-[1px] px-3 pb-3">
            <p class="mb-2 w-full whitespace-pre-wrap break-words text-2xl">
              {post.content}
            </p>
            <span class="inline-block pb-3 text-stone-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
            </span>
            <div class="flex border-t-[1px] py-3 text-sm">
              {/* Only updates the dom when I change the likeCount if I parse to int (why???) */}
              <span class="font-semibold">{parseInt(post.likeCount)}</span>
              <span class="ml-1 text-stone-500 dark:text-gray-400">
                {parseInt(post.likeCount) === 1 ? 'Like' : 'Likes'}
              </span>
            </div>
            <div class="flex border-t-[1px] pt-3">
              <Button
                variant="ghost"
                aria-label="Like"
                class={`h-8 w-8 items-center justify-center text-xl ${
                  post.userLiked
                    ? 'text-pink-500 dark:text-pink-600'
                    : 'text-stone-500 dark:text-gray-400'
                } hover:bg-pink-500 hover:bg-opacity-[0.15] hover:text-pink-500 hover:dark:bg-pink-500 hover:dark:text-pink-600`}
                onClick$={async () => {
                  if (!session.value?.user) return

                  if (post.userLiked) {
                    // optimistic update
                    post.userLiked = 0
                    post.likeCount = (parseInt(post.likeCount) - 1).toString()

                    // send request to server
                    const likeAction = await likeMutation({
                      postId: post.id,
                      action: 'unlike',
                    })

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
                    const likeAction = await likeMutation({
                      postId: post.id,
                      action: 'like',
                    })

                    if (likeAction.code !== 200) {
                      // revert optimistic update
                      post.userLiked = 0
                      post.likeCount = (parseInt(post.likeCount) - 1).toString()
                    }
                  }
                }}
              >
                {post.userLiked ? <HiHeartSolid /> : <HiHeartOutline class="stroke-2" />}
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  )
})

export const head: DocumentHead = ({ resolveValue }) => {
  const post = resolveValue(usePost)

  if ('notFound' in post || post.code !== 200) {
    return {
      title: 'Qweek not found | Queeker',
      meta: [
        {
          name: 'description',
          content: 'Post page with 404 status, Qweek (post) not found',
        },
      ],
    }
  }

  return {
    title: `${post.data?.post.author?.displayName} on Queeker: "${post.data?.post.content}"`,
    meta: [
      {
        name: 'description',
        content: `${post.data?.post.author?.displayName} on Queeker: "${post.data?.post.content}"`,
      },
    ],
  }
}
