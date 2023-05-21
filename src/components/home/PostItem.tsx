import { component$ } from '@builder.io/qwik'
import { Image } from '@unpic/qwik'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'

dayjs.extend(relativeTime)
dayjs.extend(duration)

import type { PostWithUserAndLikeCount } from '../../db/schema'
import { timeAgo } from '../../utils/dates'

interface Props {
  post: PostWithUserAndLikeCount
}

export default component$(({ post }: Props) => {
  return (
    <article class="relative flex border-b-[1px] bg-white hover:bg-stone-50 dark:bg-blue-1100 dark:hover:bg-blue-1000">
      {/* using a tag instead of Link because it was causing an error and also, */}
      {/* the docs says their internal testing found that using the <a> tag is snappier  */}
      <a href={`/${post.author?.username}`} class="absolute left-3 top-3">
        <Image
          src={post.author?.image ?? ''}
          alt="user avatar"
          layout="constrained"
          width={48}
          height={48}
          class="z-0 rounded-full"
        />
      </a>
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
      <a href={`/${post.author?.username}/status/${post.id}`} class="flex w-full p-3">
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
    </article>
  )
})
