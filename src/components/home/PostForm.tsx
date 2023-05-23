import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { server$, z } from '@builder.io/qwik-city'
import { eq, sql } from 'drizzle-orm'
import { decode } from '@auth/core/jwt'
import { Image } from '@unpic/qwik'
import type { DefaultSession } from '@auth/core/types'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { useCSSTransition } from 'qwik-transition'

import { getDb } from '../../db/db'
import { type PostWithUserAndLikeCount, posts, users } from '../../db/schema'
import Button from '../Button'
import Spinner from '../Spinner'
import Toast from '../Toast'

const postInput = z.object({
  content: z.string(),
})

type PostInput = z.infer<typeof postInput>

export const addPost = server$(async function (post: PostInput) {
  try {
    const sessionToken =
      this.env.get('NODE_ENV') === 'development'
        ? this.cookie.get('next-auth.session-token')
        : this.cookie.get('__Secure-next-auth.session-token')

    if (!sessionToken || !sessionToken?.value) throw new Error('Unauthorized')

    const decoded = await decode({
      token: sessionToken.value,
      secret: this.env.get('AUTH_SECRET') as string,
    })

    const username = decoded?.name?.split('github_handle:')[1]

    if (!username) return { code: 401, message: 'Unauthorized', data: null }

    const rateLimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(2, '30 s'),
      analytics: true,
    })

    const { success } = await rateLimit.limit(username)

    if (!success) return { code: 429, message: 'Too many requests', data: null }

    const db = getDb({ env: this.env })

    const user = await db.query.users.findFirst({ where: eq(users.username, username) })

    if (!user) return { code: 401, message: 'Unauthorized', data: null }

    const newPostQuery = await db
      .insert(posts)
      .values({ content: post.content, userId: user.id })

    const newPost = await db.query.posts.findFirst({
      where: eq(posts.id, parseInt(newPostQuery.insertId)),
      with: { author: true },
      extras: { likeCount: sql<string>`0`.as('likeCount') },
    })

    return { code: 200, message: 'success', data: newPost }
  } catch (error) {
    let message = 'Oops, something went wrong. Please try again later.'

    if (error instanceof Error) message = error.message

    return { code: 500, message, data: null }
  }
})

interface Props {
  posts: PostWithUserAndLikeCount[]
  user: DefaultSession['user']
}

export default component$(({ posts, user }: Props) => {
  const content = useSignal('')
  const loading = useSignal(false)

  const errorMessage = useSignal('')
  const toastVisible = useSignal(false)

  // enterFrom animation wasn't working w/ shouldMount and transitionOnAppear so that was left out
  const { stage } = useCSSTransition(toastVisible, { timeout: 300 })

  const textareaRef = useSignal<HTMLTextAreaElement>()

  useVisibleTask$(({ cleanup }) => {
    const setHeight = () => {
      if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
      }
    }

    textareaRef.value?.addEventListener('input', setHeight)

    cleanup(() => textareaRef.value?.removeEventListener('input', setHeight))
  })

  return (
    <form
      onSubmit$={async () => {
        loading.value = true

        const newPost = await addPost({ content: content.value })

        if (newPost.code !== 200 || !newPost.data) {
          loading.value = false

          errorMessage.value = newPost.message
          toastVisible.value = true

          return
        }

        loading.value = false

        content.value = ''

        posts.unshift(newPost.data)
      }}
      preventdefault:submit
      class="flex min-h-[5.25rem] border-b-[1px] px-3"
    >
      <Image
        src={user?.image ?? ''}
        alt="user avatar"
        layout="constrained"
        width={48}
        height={48}
        class="mt-4 h-[48px] w-[48px] rounded-full"
      />

      <textarea
        id="tweet"
        ref={textareaRef}
        bind:value={content}
        placeholder="What is happening?!"
        class="min-h-[5.25rem] flex-grow resize-none overflow-hidden bg-transparent px-3 pb-2 pt-7 text-xl focus:outline-none"
      />
      <Button
        disabled={loading.value || content.value.length === 0}
        type="submit"
        class="mt-[1.4rem] h-10 w-[5.5rem] font-semibold"
        aria-label="post"
      >
        {loading.value ? <Spinner /> : 'Queek'}
      </Button>
      <Toast
        stage={stage}
        message={errorMessage.value}
        onClose={$(() => (toastVisible.value = false))}
      />
    </form>
  )
})
