import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { postWithUserSelect, posts, users } from '../db/schema'
import { getDb } from '../db/db'
import Header from '../components/home/Header'
import PostForm from '../components/home/PostForm'
import PostItem from '../components/home/PostItem'
import ErrorMessage from '../components/ErrorMessage'
import { useAuthSession } from './plugin@auth'

export const usePosts = routeLoader$(async (reqEvent) => {
  try {
    const db = getDb(reqEvent)

    const allPosts = await db
      .select(postWithUserSelect)
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .leftJoin(users, eq(users.id, posts.userId))

    return { code: 200, message: 'success', data: allPosts }
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
  title: 'Home | Qwik Drizzle Tweet',
  meta: [
    {
      name: 'Qwik Drizzle Tweet home page',
      content: 'A twitter clone built with Qwik and Drizzle ORM',
    },
  ],
}
