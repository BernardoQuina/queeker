import { component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik'
import {
  type DocumentHead,
  routeLoader$,
  useLocation,
  server$,
} from '@builder.io/qwik-city'
import { desc, eq, sql } from 'drizzle-orm'

import { likes, posts, users } from '../../db/schema'
import { getDb } from '../../db/db'
import Header from '../../components/profile/Header'
import PostItem from '../../components/home/PostItem'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import { getIdFromToken } from '../../utils/getIdFromToken'

export const useUserPosts = routeLoader$(async (reqEvent) => {
  try {
    // Get user id from session token
    const userId = await getIdFromToken({ cookie: reqEvent.cookie, env: reqEvent.env })

    const db = getDb(reqEvent)

    const username = reqEvent.params.username

    const user = await db.query.users.findFirst({ where: eq(users.username, username) })

    if (!user) return { code: 404, message: 'User not found', data: null }

    const userPosts = await db.query.posts.findMany({
      where: eq(posts.userId, user.id),
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

    return { code: 200, message: 'success', data: { user: user, posts: userPosts } }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})

interface getPostsParams {
  offset: number
  userId: number
}

export const getUserPosts = server$(async function ({ offset, userId }: getPostsParams) {
  try {
    // Get user id from session token
    const sessionUserId = await getIdFromToken({ cookie: this.cookie, env: this.env })

    const db = getDb({ env: this.env })

    const queryPosts = await db.query.posts.findMany({
      where: eq(posts.userId, userId),
      with: { author: true, likes: { columns: {} } },
      extras: {
        likeCount: sql<string>`COUNT(posts_likes.id)`.as('like_count'),
        userLiked: sessionUserId
          ? sql<
              0 | 1
            >`EXISTS (SELECT 1 FROM ${likes} WHERE likes.post_id = ${posts.id} AND likes.user_id = ${sessionUserId})`.as(
              'user_liked'
            )
          : sql<0 | 1>`0`.as('user_liked'),
      },
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
  const profileSignal = useUserPosts()

  const user = useStore(profileSignal.value.data?.user ?? { notFound: true })
  const userPosts = useStore(profileSignal.value.data?.posts ?? [])

  const loadingMore = useSignal(false)

  const location = useLocation()

  useVisibleTask$(({ cleanup }) => {
    const nearBottom = async () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !loadingMore.value &&
        'id' in user
      ) {
        loadingMore.value = true

        const newPosts = await getUserPosts({ offset: userPosts.length, userId: user.id })

        if (newPosts.code !== 200 || !newPosts.data) {
          loadingMore.value = false
          return
        }

        if (newPosts?.data?.length === 0) {
          window.removeEventListener('scroll', nearBottom)

          loadingMore.value = false
          return
        }

        userPosts.push(...newPosts.data)

        // small timeout to prevent multiple requests
        setTimeout(() => (loadingMore.value = false), 500)
      }
    }

    window.addEventListener('scroll', nearBottom)

    cleanup(() => window.removeEventListener('scroll', nearBottom))
  })

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
          <section class="flex flex-col pb-32">
            {userPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}

            {loadingMore.value ? (
              <div class="mt-14">
                <Spinner />
              </div>
            ) : (
              <div class="mt-14 h-2 w-2 self-center rounded-full bg-stone-200 dark:bg-slate-600" />
            )}
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
