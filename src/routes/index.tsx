import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'
import { LuRotateCcw } from '@qwikest/icons/lucide'

import { postWithUserSelect, posts, users } from '../db/schema'
import { getDb } from '../db/db'
import Header from '../components/home/Header'
import PostForm from '../components/home/PostForm'
import PostItem from '../components/home/PostItem'
import Button from '../components/Button'
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
          <div class="mt-4 flex flex-col items-center self-center">
            <h4 class="mb-2 text-xl font-semibold">Error</h4>
            <p class="text-stone-500 dark:text-gray-400">
              {postsSignal.value.message ??
                'Oops, something went wrong. Please try again later.'}
            </p>
            <a href="/">
              <Button class="mt-5 flex w-[8.5rem] items-center justify-center py-2">
                <div class="text-xl text-white">
                  <LuRotateCcw />
                </div>
                <span class="ml-2 font-medium text-white">Try again</span>
              </Button>
            </a>
          </div>
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
