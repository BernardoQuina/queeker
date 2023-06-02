import { component$, useSignal, useStore } from '@builder.io/qwik'
import {
  type DocumentHead,
  routeLoader$,
  useLocation,
  server$,
} from '@builder.io/qwik-city'
import {
  HiChatBubbleOvalLeftOutline,
  HiHeartOutline,
  HiHeartSolid,
} from '@qwikest/icons/heroicons'

import ErrorMessage from '../../../../components/global/ErrorMessage'
import Header from '../../../../components/pages/post/Header'
import { formatDate } from '../../../../utils/dates'
import { useAuthSession } from '../../../plugin@auth'
import Button from '../../../../components/global/Button'
import { procedures } from '../../../../procedures'
import type { LikeInput } from '../../../../procedures/likes'
import ReplyForm from '../../../../components/pages/post/ReplyForm'

export const usePost = routeLoader$(async (req) => {
  return procedures(req).posts.query.getById({ id: parseInt(req.params.postId) })
})

const likePost = server$(async function ({ postId, action }: LikeInput) {
  return procedures(this).likes.mutation.like({ postId, action })
})

export default component$(() => {
  const postSignal = usePost()

  const post = useStore(postSignal.value.data?.post ?? { notFound: true })

  const location = useLocation()

  const session = useAuthSession()

  const textareaRef = useSignal<HTMLTextAreaElement>()

  return (
    <div class="w-[600px] max-w-full flex-grow self-center border-l-[1px] border-r-[1px]">
      {'notFound' in post || postSignal.value.code !== 200 ? (
        <ErrorMessage
          message={postSignal.value.message}
          retryHref={location.url.pathname}
        />
      ) : (
        <>
          <Header user={post.author} />
          <section class="border-b-[1px] px-3 pb-3">
            <p class="mb-2 w-full whitespace-pre-wrap break-words text-2xl">
              {post.content}
            </p>
            <span class="inline-block pb-3 text-stone-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
            </span>
            <div class="flex border-t-[1px] py-3 text-sm">
              <div>
                {/* Only updates the dom when I change the likeCount if I parse to int (why???) */}
                <span class="font-semibold">{parseInt(post.likeCount)}</span>
                <span class="ml-1 text-stone-500 dark:text-gray-400">
                  {parseInt(post.likeCount) === 1 ? 'Like' : 'Likes'}
                </span>
              </div>
              <div class="ml-5">
                {/* Only updates the dom when I change the likeCount if I parse to int (why???) */}
                <span class="font-semibold">{parseInt(post.replyCount)}</span>
                <span class="ml-1 text-stone-500 dark:text-gray-400">
                  {parseInt(post.replyCount) === 1 ? 'Reply' : 'Replies'}
                </span>
              </div>
            </div>
            <div
              class={`flex border-t-[1px] ${
                session.value?.user ? 'py-[0.375rem]' : '-mb-[0.375rem] pt-[0.375rem]'
              } `}
            >
              <Button
                variant="ghost"
                aria-label="Like"
                class={`h-8 w-8 items-center justify-center text-xl ${
                  post.userLiked
                    ? 'text-pink-500 dark:text-pink-600'
                    : 'text-stone-500 dark:text-gray-400'
                } hover:bg-pink-500 hover:bg-opacity-[0.15] hover:text-pink-500 hover:dark:bg-pink-500 hover:dark:text-pink-600`}
                onClick$={async () => {
                  if (!session.value?.user) return

                  if (post.userLiked) {
                    // optimistic update
                    post.userLiked = 0
                    post.likeCount = (parseInt(post.likeCount) - 1).toString()

                    // send request to server
                    const unlike = await likePost({ postId: post.id, action: 'unlike' })

                    if (unlike.code !== 200) {
                      // revert optimistic update
                      post.userLiked = 1
                      post.likeCount = (parseInt(post.likeCount) + 1).toString()
                    }
                  } else {
                    // optimistic update
                    post.userLiked = 1
                    post.likeCount = (parseInt(post.likeCount) + 1).toString()

                    // send request to server
                    const like = await likePost({ postId: post.id, action: 'like' })

                    if (like.code !== 200) {
                      // revert optimistic update
                      post.userLiked = 0
                      post.likeCount = (parseInt(post.likeCount) - 1).toString()
                    }
                  }
                }}
              >
                {post.userLiked ? <HiHeartSolid /> : <HiHeartOutline class="stroke-2" />}
              </Button>
              <Button
                variant="ghost"
                aria-label="Like"
                class="ml-5 h-8 w-8 items-center justify-center text-xl text-stone-500 hover:bg-pink-500 hover:bg-opacity-[0.15] hover:text-blue-550 dark:text-gray-400 hover:dark:bg-blue-550 hover:dark:text-blue-550"
                onClick$={async () => textareaRef.value?.focus()}
              >
                <HiChatBubbleOvalLeftOutline class="stroke-2" />
              </Button>
            </div>
            <ReplyForm
              user={session.value?.user}
              postId={post.id}
              textareaRef={textareaRef}
            />
          </section>
        </>
      )}
    </div>
  )
})

export const head: DocumentHead = ({ resolveValue }) => {
  const post = resolveValue(usePost)

  if ('notFound' in post || post.code !== 200) {
    return {
      title: 'Qweek not found | Queeker',
      meta: [
        {
          name: 'description',
          content: 'Post page with 404 status, Qweek (post) not found',
        },
      ],
    }
  }

  return {
    title: `${post.data?.post.author?.displayName} on Queeker: "${post.data?.post.content}"`,
    meta: [
      {
        name: 'description',
        content: `${post.data?.post.author?.displayName} on Queeker: "${post.data?.post.content}"`,
      },
    ],
  }
}
