import { component$ } from '@builder.io/qwik'
import { server$, useNavigate } from '@builder.io/qwik-city'
import { Image } from '@unpic/qwik'
import {
  HiHeartOutline,
  HiHeartSolid,
  HiChatBubbleOvalLeftOutline,
} from '@qwikest/icons/heroicons'

import { timeAgo } from '../../utils/dates'
import { useAuthSession } from '../../routes/plugin@auth'
import { api } from '../../api'
import type { LikeInput } from '../../api/likes'
import type { GetManyPosts } from '../../api/posts'
import Button from './Button'

const likePost = server$(async function ({ postId, action }: LikeInput) {
  return api(this).likes.mutation.like({ postId, action })
})

interface Props {
  post: GetManyPosts[0]
  isInReplyTree?: boolean
}

export default component$(({ post, isInReplyTree }: Props) => {
  const session = useAuthSession()

  const nav = useNavigate()

  return (
    <article
      class={`relative flex ${
        !isInReplyTree && 'border-b-[1px]'
      } bg-white hover:bg-stone-50 dark:bg-blue-1100 dark:hover:bg-blue-1000`}
    >
      {/* using a tag instead of Link because it was causing an error and also, */}
      {/* the docs says their internal testing found that using the <a> tag is snappier  */}
      <a href={`/${post.author?.username}`} class="absolute left-3 top-3 z-[2]">
        <Image
          src={post.author?.image ?? ''}
          alt="user avatar"
          layout="constrained"
          width={48}
          height={48}
          class="z-0 rounded-full"
        />
      </a>
      {isInReplyTree && (
        <div class="absolute left-9 top-3 z-[1] h-full w-[2px] bg-stone-200 dark:bg-slate-600" />
      )}
      <a
        href={`/${post.author?.username}`}
        class="absolute left-[4.75rem] top-3 z-[1] flex w-[calc(100%-72px)]"
      >
        {post.author?.displayName && (
          <span class="mr-1 max-w-[38%] truncate break-words font-semibold hover:underline sm:max-w-[43%]">
            {post.author.displayName}
          </span>
        )}
        <span class="max-w-[38%] truncate break-words text-stone-500 dark:text-gray-400 sm:max-w-[43%]">
          @{post.author?.username}
        </span>
        <span class="dark:text-gray-400º px-1 text-stone-500">·</span>
        <span class="text-stone-500 dark:text-gray-400">{timeAgo(post.createdAt)}</span>
      </a>
      <a
        href={`/${post.author?.username}/status/${post.id}`}
        class="flex w-full p-3 pb-[2.5rem]"
      >
        {/* Placeholder for avatar */}
        <div class="min-h-[48px] min-w-[60px]" />
        <div class="flex w-[calc(100%-60px)] flex-col">
          {/* Placeholder for name and username */}
          <div class="flex opacity-0">
            {post.author?.displayName && (
              <span class="mr-1 max-w-[38%] truncate break-words font-semibold hover:underline sm:max-w-[43%]">
                {post.author.displayName}
              </span>
            )}
            <span class="max-w-[38%] truncate break-words text-stone-500 dark:text-gray-400 sm:max-w-[43%]">
              @{post.author?.username}
            </span>
            <span class="px-1 text-stone-500 dark:text-gray-400">·</span>
            <span class="text-stone-500 dark:text-gray-400">
              {timeAgo(post.createdAt)}
            </span>
          </div>
          <p class="w-full whitespace-pre-wrap break-words">{post.content}</p>
        </div>
      </a>
      <div
        class="group absolute bottom-[0.4rem] left-[4.25rem] flex cursor-pointer items-center"
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
        <Button
          variant="ghost"
          aria-label="Like"
          class={`pointer-events-none h-8 w-8 items-center justify-center text-xl ${
            post.userLiked
              ? 'text-pink-500 dark:text-pink-600'
              : 'text-stone-500 dark:text-gray-400'
          } group-hover:bg-pink-500 group-hover:bg-opacity-[0.15] group-hover:text-pink-500 group-hover:dark:text-pink-600`}
        >
          {post.userLiked ? <HiHeartSolid /> : <HiHeartOutline class="stroke-2" />}
        </Button>
        <span
          class={`pl-1 pr-3 text-sm ${
            post.userLiked
              ? 'text-pink-500 dark:text-pink-600'
              : 'text-stone-500 dark:text-gray-400'
          } group-hover:text-pink-500 group-hover:dark:text-pink-600`}
        >
          {post.likeCount}
        </span>
      </div>
      <div
        class="group absolute bottom-[0.4rem] left-[8rem] flex cursor-pointer items-center"
        onClick$={async () => nav(`/${post.author?.username}/status/${post.id}`)}
      >
        <Button
          variant="ghost"
          aria-label="Like"
          class={`pointer-events-none h-8 w-8 items-center justify-center text-xl text-stone-500 group-hover:bg-blue-550 group-hover:bg-opacity-[0.15] group-hover:text-blue-550 dark:text-gray-400 group-hover:dark:text-blue-550`}
        >
          <HiChatBubbleOvalLeftOutline class="stroke-2" />
        </Button>
        <span
          class={`pl-1 pr-3 text-sm text-stone-500 group-hover:text-blue-550 dark:text-gray-400 group-hover:dark:text-blue-550`}
        >
          {post.replyCount}
        </span>
      </div>
    </article>
  )
})
