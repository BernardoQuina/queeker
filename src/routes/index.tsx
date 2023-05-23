import { component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$, server$ } from '@builder.io/qwik-city'
import { desc } from 'drizzle-orm'

import { likes, posts } from '../db/schema'
import { getDb } from '../db/db'
import { countWithColumn } from '../db/helpers'
import Header from '../components/home/Header'
import PostForm from '../components/home/PostForm'
import PostItem from '../components/home/PostItem'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import { useAuthSession } from './plugin@auth'

export const usePosts = routeLoader$(async (reqEvent) => {
  try {
    const db = getDb(reqEvent)

    const queryPosts = await db.query.posts.findMany({
      with: { author: true },
      extras: { likeCount: countWithColumn(likes.postId.name).as('likeCount') },
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

export const getPosts = server$(async function ({ offset }: { offset: number }) {
  try {
    const db = getDb({ env: this.env })

    const queryPosts = await db.query.posts.findMany({
      with: { author: true },
      extras: { likeCount: countWithColumn(likes.postId.name).as('likeCount') },
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

export default component$(() => {
  const postsSignal = usePosts()
  const posts = useStore(postsSignal.value.data ?? [])

  const loadingMore = useSignal(false)

  const session = useAuthSession()

  useVisibleTask$(({ cleanup }) => {
    const nearBottom = async () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        !loadingMore.value
      ) {
        loadingMore.value = true

        const newPosts = await getPosts({ offset: posts.length })

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
