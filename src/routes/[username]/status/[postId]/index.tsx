import { component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik'
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
import PostHeader from '../../../../components/pages/post/PostHeader'
import { formatDate } from '../../../../utils/dates'
import { useAuthSession } from '../../../plugin@auth'
import Button from '../../../../components/global/Button'
import { api } from '../../../../api'
import type { LikeInput } from '../../../../api/likes'
import ReplyForm from '../../../../components/pages/post/ReplyForm'
import type { GetManyPosts, GetManyPostsParams } from '../../../../api/posts'
import PostItem from '../../../../components/global/PostItem'
import Spinner from '../../../../components/global/Spinner'
import ParentPost from '../../../../components/pages/post/ParentPost'
import PageHeader from '../../../../components/pages/post/PageHeader'

export const usePost = routeLoader$(async (req) => {
  return api(req).posts.query.getById({ id: parseInt(req.params.postId) })
})

const likePost = server$(async function ({ postId, action }: LikeInput) {
  return api(this).likes.mutation.like({ postId, action })
})

const getReplies = server$(async function ({
  replyToPostId,
  offset,
}: GetManyPostsParams) {
  return api(this).posts.query.getMany({ replyToPostId, offset })
})

export default component$(() => {
  const postSignal = usePost()

  const post = useStore(postSignal.value.data ?? { notFound: true })

  const location = useLocation()

  const session = useAuthSession()

  const textareaRef = useSignal<HTMLTextAreaElement>()

  const replies = useStore<GetManyPosts>([])
  const loadingReplies = useSignal(true)
  const repliesErrorMessage = useSignal('')

  useVisibleTask$(async ({ cleanup }) => {
    if ('notFound' in post || postSignal.value.code !== 200) return

    // Get latest replies
    const latestReplies = await getReplies({ replyToPostId: post.id, offset: 0 })

    if (latestReplies.code !== 200 || !latestReplies.data) {
      loadingReplies.value = false

      repliesErrorMessage.value = latestReplies.message

      return
    }

    loadingReplies.value = false

    replies.push(...latestReplies.data)

    // Get more replies when near bottom
    const nearBottom = async () => {
      if (replies.length < 25) {
        window.removeEventListener('scroll', nearBottom)

        loadingReplies.value = false
        return
      }

      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !loadingReplies.value
      ) {
        loadingReplies.value = true

        const newReplies = await getReplies({
          replyToPostId: post.id,
          offset: replies.length,
        })

        if (newReplies.code !== 200 || !newReplies.data) {
          loadingReplies.value = false
          return
        }

        if (newReplies?.data?.length === 0) {
          window.removeEventListener('scroll', nearBottom)

          loadingReplies.value = false
          return
        }

        replies.push(...newReplies.data)

        // small timeout to prevent multiple requests
        setTimeout(() => (loadingReplies.value = false), 500)
      }
    }

    window.addEventListener('scroll', nearBottom)

    cleanup(() => window.removeEventListener('scroll', nearBottom))
  })

  return (
    <div class="w-[600px] max-w-full flex-grow self-center border-l-[1px] border-r-[1px]">
      <PageHeader />
      {'notFound' in post || postSignal.value.code !== 200 ? (
        <div class="mt-[5rem]">
          <ErrorMessage
            message={postSignal.value.message}
            retryHref={location.url.pathname}
          />
        </div>
      ) : (
        <div class="mt-[4.2rem]">
          {post.parentPost && <ParentPost parentPost={post.parentPost} />}
          <PostHeader user={post.author} />
          <section class="border-b-[1px] px-3 pb-3">
            <p class="mb-2 w-full whitespace-pre-wrap break-words text-xl">
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
              replies={replies}
              user={session.value?.user}
              post={post}
              textareaRef={textareaRef}
            />
          </section>
          <section class="flex flex-col pb-32">
            {repliesErrorMessage.value ? (
              <ErrorMessage message={repliesErrorMessage.value} />
            ) : (
              replies.map((reply) => <PostItem key={post.id} post={reply} />)
            )}

            {loadingReplies.value ? (
              <div class="mt-14">
                <Spinner />
              </div>
            ) : (
              <div class="mt-14 h-2 w-2 self-center rounded-full bg-stone-200 dark:bg-slate-600" />
            )}
          </section>
        </div>
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
    title: `${post.data?.author?.displayName} on Queeker: "${post.data?.content}"`,
    meta: [
      {
        name: 'description',
        content: `${post.data?.author?.displayName} on Queeker: "${post.data?.content}"`,
      },
    ],
  }
}
