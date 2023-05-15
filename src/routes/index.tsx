import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { postWithUserSelect, posts, users } from '../db/schema'
import { getDb } from '../db/db'
import Header from '../components/home/Header'
import PostForm from '../components/home/PostForm'
import { useAuthSession } from './plugin@auth'

export const usePosts = routeLoader$(async (reqEvent) => {
  const db = getDb(reqEvent)

  const allPosts = await db
    .select(postWithUserSelect)
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .leftJoin(users, eq(users.id, posts.userId))

  return allPosts
})

export default component$(() => {
  const postsSignal = usePosts()

  const posts = useStore(postsSignal.value)

  const session = useAuthSession()

  return (
    <div>
      <Header />
      {session.value?.user && <PostForm posts={posts} />}
      <section class="pb-20">
        {posts.map((post) => (
          <article key={post.id}>{post.content}</article>
        ))}
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
