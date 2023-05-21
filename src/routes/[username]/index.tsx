import { component$, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$, useLocation } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { likes, posts, users } from '../../db/schema'
import { getDb } from '../../db/db'
import Header from '../../components/profile/Header'
import PostItem from '../../components/home/PostItem'
import ErrorMessage from '../../components/ErrorMessage'
import { countWithColumn } from '../../db/helpers'

export const useUserPosts = routeLoader$(async (reqEvent) => {
  try {
    const db = getDb(reqEvent)

    const username = reqEvent.params.username

    const user = await db.query.users.findFirst({ where: eq(users.username, username) })

    if (!user) return { code: 404, message: 'User not found', data: null }

    const userPosts = await db.query.posts.findMany({
      where: eq(posts.userId, user.id),
      with: { author: true },
      extras: { likeCount: countWithColumn(likes.postId.name).as('likeCount') },
      orderBy: desc(posts.createdAt),
    })

    return { code: 200, message: 'success', data: { user: user, posts: userPosts } }
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

export const head: DocumentHead = ({ resolveValue }) => {
  const profile = resolveValue(useUserPosts)

  if ('notFound' in profile || profile.code !== 200) {
    return {
      title: 'User not found | Queeker',
      meta: [
        {
          name: 'description',
          content: 'Profile page with 404 status, user not found',
        },
      ],
    }
  }

  return {
    title: `${profile.data?.user.displayName} (@${profile.data?.user.username}) | Queeker`,
    meta: [
      {
        name: 'description',
        content: `Profile page for ${profile.data?.user.displayName} (@${profile.data?.user.username})`,
      },
    ],
  }
}
