import { component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik'
import {
  type DocumentHead,
  routeLoader$,
  useLocation,
  server$,
} from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { likes, posts, users } from '../../db/schema'
import { getDb } from '../../db/db'
import Header from '../../components/profile/Header'
import PostItem from '../../components/home/PostItem'
import ErrorMessage from '../../components/ErrorMessage'
import { countWithColumn } from '../../db/helpers'
import Spinner from '../../components/Spinner'

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
    const db = getDb({ env: this.env })

    const queryPosts = await db.query.posts.findMany({
      where: eq(posts.userId, userId),
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
  const profileSignal = useUserPosts()

  const user = useStore(profileSignal.value.data?.user ?? { notFound: true })
  const userPosts = useStore(profileSignal.value.data?.posts ?? [])

  const loadingMore = useSignal(false)

  const location = useLocation()

  useVisibleTask$(({ cleanup }) => {
    const nearBottom = async () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
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
