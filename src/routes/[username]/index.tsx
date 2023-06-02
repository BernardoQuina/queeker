import { component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik'
import {
  type DocumentHead,
  routeLoader$,
  useLocation,
  server$,
} from '@builder.io/qwik-city'

import Header from '../../components/pages/profile/Header'
import PostItem from '../../components/global/PostItem'
import ErrorMessage from '../../components/global/ErrorMessage'
import Spinner from '../../components/global/Spinner'
import { procedures } from '../../procedures'
import type { GetManyPostsParams } from '../../procedures/posts'

export const useUserPosts = routeLoader$(async (req) => {
  const userRes = await procedures(req).users.query.getByUsername({
    username: req.params.username,
  })

  if (userRes.code !== 200 || !userRes.data) {
    return { code: userRes.code, message: userRes.message, data: null }
  }

  const user = userRes.data.user

  const posts = await procedures(req).posts.query.getMany({
    userId: user.id,
    noReplies: true,
  })

  if (posts.code !== 200 || !posts.data) {
    return { code: posts.code, message: posts.message, data: null }
  }

  return { code: 200, message: 'success', data: { user, posts: posts.data } }
})

const getMorePosts = server$(async function ({ offset, userId }: GetManyPostsParams) {
  return procedures(this).posts.query.getMany({ offset, userId, noReplies: true })
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

        const newPosts = await getMorePosts({ offset: userPosts.length, userId: user.id })

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
