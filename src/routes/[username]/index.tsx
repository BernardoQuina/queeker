import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { postWithUserSelect, posts, users } from '../../db/schema'
import { getDb } from '../../db/db'
import Header from '../../components/profile/Header'
import PostForm from '../../components/home/PostForm'
import PostItem from '../../components/home/PostItem'
import { useAuthSession } from '.././plugin@auth'

export const useUserPosts = routeLoader$(async (reqEvent) => {
  const db = getDb(reqEvent)

  const username = reqEvent.url.pathname.replaceAll('/', '')

  const user = await db.select().from(users).where(eq(users.username, username))

  if (!user[0]) {
    throw new Error('User not found')
  }

  const allPosts = await db
    .select(postWithUserSelect)
    .from(posts)
    .where(eq(posts.userId, user[0].id))
    .orderBy(desc(posts.createdAt))
    .leftJoin(users, eq(users.id, posts.userId))

  return { user: user[0], posts: allPosts }
})

export default component$(() => {
  const postsSignal = useUserPosts()

  const user = useStore(postsSignal.value.user)
  const userPosts = useStore(postsSignal.value.posts)

  const session = useAuthSession()

  return (
    <div class="w-[600px] max-w-full self-center border-l-[1px] border-r-[1px]">
      <Header user={user} />
      <section class="pb-20">
        {session.value?.user && <PostForm posts={userPosts} user={session.value.user} />}
        {userPosts.map((post) => (
          <PostItem key={post.id} post={post} />
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
