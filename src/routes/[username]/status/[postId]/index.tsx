import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$, useLocation } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { postWithUserSelect, posts, users } from '../../../../db/schema'
import { getDb } from '../../../../db/db'
import ErrorMessage from '../../../../components/ErrorMessage'
import Header from '../../../../components/post/Header'
import { formatDate } from '../../../../utils/dates'

export const usePost = routeLoader$(async (reqEvent) => {
  try {
    const db = getDb(reqEvent)

    const postId = parseInt(reqEvent.params.postId)

    if (isNaN(postId)) return { code: 400, message: 'Invalid post id', data: null }

    const post = await db
      .select(postWithUserSelect)
      .from(posts)
      .where(eq(posts.id, postId))
      .orderBy(desc(posts.createdAt))
      .leftJoin(users, eq(users.id, posts.userId))

    if (!post[0]) return { code: 404, message: 'Qweek not found', data: null }

    return { code: 200, message: 'success', data: { post: post[0] } }
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

  return (
    <div class="w-[600px] max-w-full flex-grow self-center border-l-[1px] border-r-[1px]">
      {'notFound' in post || postSignal.value.code !== 200 ? (
        <ErrorMessage
          message={postSignal.value.message}
          retryHref={location.url.pathname}
        />
      ) : (
        <>
          <Header user={post.user} />
          <section class="border-b-[1px] px-3 pb-3">
            <p class="mb-2 w-full whitespace-pre-wrap break-words text-xl">
              {post.content}
            </p>
            <span class="text-stone-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
            </span>
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
    title: `${post.data?.post.user?.displayName} on Queeker: "${post.data?.post.content}"`,
    meta: [
      {
        name: 'description',
        content: `${post.data?.post.user?.displayName} on Queeker: "${post.data?.post.content}"`,
      },
    ],
  }
}
