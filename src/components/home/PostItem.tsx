import { component$ } from '@builder.io/qwik'
import { Image } from '@unpic/qwik'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'

dayjs.extend(relativeTime)
dayjs.extend(duration)

import type { PostWithUser } from '../../db/schema'

interface Props {
  post: PostWithUser
}

export default component$(({ post }: Props) => {
  const now = dayjs()
  const postDate = dayjs(post.createdAt)

  const duration = dayjs.duration(now.diff(postDate))
  const hoursDiff = Math.floor(duration.asHours())

  let relativeTime = ''

  if (duration.asSeconds() < 10) {
    relativeTime = 'now'
  } else if (duration.asMinutes() < 1) {
    relativeTime = `${Math.floor(duration.asSeconds())}s`
  } else if (hoursDiff < 1) {
    relativeTime = `${Math.floor(duration.asMinutes())}m`
  } else if (hoursDiff < 24) {
    relativeTime = `${Math.floor(duration.asHours())}h`
  } else {
    relativeTime = postDate.format('MMM DD')
  }

  return (
    <article class="relative flex border-b-[1px] bg-white hover:bg-stone-50 dark:bg-blue-1100 dark:hover:bg-blue-1000">
      {/* using a tag instead of Link because it was causing an error and also, */}
      {/* the docs says their internal testing found that using the <a> tag is snappier  */}
      <a href={`/${post.user?.username}`} class="absolute left-3 top-3">
        <Image
          src={post.user?.image ?? ''}
          alt="user avatar"
          layout="constrained"
          width={48}
          height={48}
          class="z-0 rounded-full"
        />
      </a>
      <a
        href={`/${post.user?.username}`}
        class="absolute left-[4.75rem] top-3 z-[1] flex"
      >
        {post.user?.displayName && (
          <span class="mr-1 font-semibold hover:underline">{post.user.displayName}</span>
        )}
        <span class="text-stone-500 dark:text-gray-400">@{post.user?.username} </span>
        <span class="dark:text-gray-400º px-1 text-stone-500">·</span>
        <span class="text-stone-500 dark:text-gray-400">{relativeTime}</span>
      </a>
      <a href={`/${post.user?.username}/status/${post.id}`} class="flex w-full p-3">
        {/* Placeholder for avatar */}
        <div class="min-h-[48px] min-w-[60px]" />
        <div class="flex flex-col">
          {/* Placeholder for name and username */}
          <div class="flex opacity-0">
            {post.user?.displayName && (
              <span class="mr-1 font-semibold">{post.user.displayName}</span>
            )}
            <span class="text-stone-500 dark:text-gray-400">@{post.user?.username} </span>
            <span class="px-1 text-stone-500 dark:text-gray-400">·</span>
            <span class="text-stone-500 dark:text-gray-400">{relativeTime}</span>
          </div>
          <p>{post.content}</p>
        </div>
      </a>
    </article>
  )
})
