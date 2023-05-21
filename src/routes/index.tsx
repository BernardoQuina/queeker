import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city'
import { desc } from 'drizzle-orm'

import { likes, posts } from '../db/schema'
import { getDb } from '../db/db'
import { countWithColumn } from '../db/helpers'
import Header from '../components/home/Header'
import PostForm from '../components/home/PostForm'
import PostItem from '../components/home/PostItem'
import ErrorMessage from '../components/ErrorMessage'
import { useAuthSession } from './plugin@auth'

export const usePosts = routeLoader$(async (reqEvent) => {
  try {
    const db = getDb(reqEvent)

    const newPosts = await db.query.posts.findMany({
      with: { author: true },
      extras: { likeCount: countWithColumn(likes.postId.name).as('likeCount') },
      orderBy: desc(posts.createdAt),
    })

    return { code: 200, message: 'success', data: newPosts }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})

export default component$(() => {
  const postsSignal = usePosts()

  const posts = useStore(postsSignal.value.data ?? [])

  const session = useAuthSession()

  return (
    <div class="w-[600px] max-w-full flex-grow self-center border-l-[1px] border-r-[1px]">
      <Header />
      <section class="flex flex-col pb-20 pt-[3.3rem]">
        {session.value?.user && <PostForm posts={posts} user={session.value.user} />}
        {postsSignal.value.code !== 200 ? (
          <ErrorMessage message={postsSignal.value.message} />
        ) : (
          posts.map((post) => <PostItem key={post.id} post={post} />)
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
