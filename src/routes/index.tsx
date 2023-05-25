import { component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city'
import { desc, sql } from 'drizzle-orm'

import { likes, posts } from '../db/schema'
import { getDb } from '../db/db'
import Header from '../components/pages/home/Header'
import PostForm from '../components/pages/home/PostForm'
import PostItem from '../components/global/PostItem'
import ErrorMessage from '../components/global/ErrorMessage'
import Spinner from '../components/global/Spinner'
import { getIdFromToken } from '../utils/getIdFromToken'
import { postsQuery } from '../procedures/posts'
import { useAuthSession } from './plugin@auth'

export const usePosts = routeLoader$(async (reqEvent) => {
  try {
    // Get user id from session token
    const userId = await getIdFromToken({ cookie: reqEvent.cookie, env: reqEvent.env })

    const db = getDb(reqEvent)

    const queryPosts = await db.query.posts.findMany({
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
      limit: 25,
      orderBy: desc(posts.createdAt),
    })

    return { code: 200, message: 'success', data: queryPosts }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})

export default component$(() => {
  const postsSignal = usePosts()
  const posts = useStore(postsSignal.value.data ?? [])

  const loadingMore = useSignal(false)

  const session = useAuthSession()

  useVisibleTask$(({ cleanup }) => {
    const nearBottom = async () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !loadingMore.value
      ) {
        loadingMore.value = true

        const newPosts = await postsQuery({ offset: posts.length })

        if (newPosts.code !== 200 || !newPosts.data) {
          loadingMore.value = false
          return
        }

        if (newPosts?.data?.length === 0) {
          window.removeEventListener('scroll', nearBottom)

          loadingMore.value = false
          return
        }

        posts.push(...newPosts.data)

        // small timeout to prevent multiple requests
        setTimeout(() => (loadingMore.value = false), 500)
      }
    }

    window.addEventListener('scroll', nearBottom)

    cleanup(() => window.removeEventListener('scroll', nearBottom))
  })

  return (
    <div class="w-[600px] max-w-full flex-grow self-center border-l-[1px] border-r-[1px]">
      <Header />
      <section class="flex flex-col pb-32 pt-[3.3rem]">
        {session.value?.user && <PostForm posts={posts} user={session.value.user} />}
        {postsSignal.value.code !== 200 ? (
          <ErrorMessage message={postsSignal.value.message} />
        ) : (
          posts.map((post) => <PostItem key={post.id} post={post} />)
        )}

        {loadingMore.value ? (
          <div class="mt-14">
            <Spinner />
          </div>
        ) : (
          <div class="mt-14 h-2 w-2 self-center rounded-full bg-stone-200 dark:bg-slate-600" />
        )}
      </section>
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Home | Queeker',
  meta: [
    {
      name: 'description',
      content: 'Queeker home page, a twitter clone built with Qwik and Drizzle ORM',
    },
  ],
}
