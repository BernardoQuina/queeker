import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$, useLocation } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { postWithUserSelect, posts, users } from '../../db/schema'
import { getDb } from '../../db/db'
import Header from '../../components/profile/Header'
import PostItem from '../../components/home/PostItem'
import ErrorMessage from '../../components/ErrorMessage'

export const useUserPosts = routeLoader$(async (reqEvent) => {
  try {
    const db = getDb(reqEvent)

    const username = reqEvent.url.pathname.replaceAll('/', '')

    const user = await db.select().from(users).where(eq(users.username, username))

    if (!user[0]) {
      return { code: 404, message: 'User not found', data: null }
    }

    const allPosts = await db
      .select(postWithUserSelect)
      .from(posts)
      .where(eq(posts.userId, user[0].id))
      .orderBy(desc(posts.createdAt))
      .leftJoin(users, eq(users.id, posts.userId))

    return { code: 200, message: 'success', data: { user: user[0], posts: allPosts } }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})

export default component$(() => {
  const profileSignal = useUserPosts()

  const user = useStore(profileSignal.value.data?.user ?? { notFound: true })
  const userPosts = useStore(profileSignal.value.data?.posts ?? [])

  const location = useLocation()

  return (
    <div class="w-[600px] max-w-full flex-grow self-center border-l-[1px] border-r-[1px]">
      {'notFound' in user || profileSignal.value.code !== 200 ? (
        <ErrorMessage
          message={profileSignal.value.message}
          retryHref={location.url.pathname}
        />
      ) : (
        <>
          <Header user={user} />
          <section class="pb-20">
            {userPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </section>
        </>
      )}
    </div>
  )
})

export const head: DocumentHead = ({ resolveValue, params }) => {
  const profile = resolveValue(useUserPosts)

  if ('notFound' in profile || profile.code !== 200) {
    return {
      title: 'User not found | Qwik Drizzle Tweet',
      meta: [
        {
          name: 'Qwik Drizzle Tweet user not found page',
          content: 'A twitter clone built with Qwik and Drizzle ORM',
        },
      ],
    }
  }

  return {
    title: `${profile.data?.user.displayName} (@${profile.data?.user.username}) | Qwik Drizzle Tweet`,
    meta: [
      {
        name: 'Qwik Drizzle Tweet user profile page',
        content: 'A twitter clone built with Qwik and Drizzle ORM',
      },
    ],
  }
}
