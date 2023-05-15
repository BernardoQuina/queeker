import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { server$, z } from '@builder.io/qwik-city'
import { eq } from 'drizzle-orm'
import { decode } from '@auth/core/jwt'
import { Image } from '@unpic/qwik'
import type { DefaultSession } from '@auth/core/types'

import { getDb } from '../../db/db'
import { posts, users, type PostWithUser, postWithUserSelect } from '../../db/schema'
import Button from '../Button'
import Spinner from '../Spinner'

const postInput = z.object({
  content: z.string(),
})

type PostInput = z.infer<typeof postInput>

export const addPost = server$(async function (post: PostInput) {
  const sessionToken = this.cookie.get('next-auth.session-token')

  if (!sessionToken || !sessionToken?.value) throw new Error('Unauthorized')

  const decoded = await decode({
    token: sessionToken.value,
    secret: this.env.get('AUTH_SECRET') as string,
  })

  const username = decoded?.name?.split('github_handle:')[1]

  if (!username) throw new Error('Unauthorized')

  const db = getDb({ env: this.env })

  const user = await db.select().from(users).where(eq(users.username, username))

  if (!user[0]) throw new Error('Unauthorized')

  const newPostQuery = await db.insert(posts).values({
    content: post.content,
    userId: user[0].id,
  })

  const newPost = await db
    .select(postWithUserSelect)
    .from(posts)
    .where(eq(posts.id, parseInt(newPostQuery.insertId)))
    .leftJoin(users, eq(users.id, posts.userId))

  return { success: true, data: newPost[0] }
})

interface Props {
  posts: PostWithUser[]
  user: DefaultSession['user']
}

export default component$(({ posts, user }: Props) => {
  const content = useSignal('')
  const loading = useSignal(false)

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
      >
        {loading.value ? <Spinner /> : 'Tweet'}
      </Button>
    </form>
  )
})
