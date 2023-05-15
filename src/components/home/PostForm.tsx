import { component$, useSignal } from '@builder.io/qwik'
import { server$, z } from '@builder.io/qwik-city'
import { eq } from 'drizzle-orm'
import { decode } from '@auth/core/jwt'

import { getDb } from '../../db/db'
import { posts, users, type PostWithUser, postWithUserSelect } from '../../db/schema'

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
}

export default component$(({ posts }: Props) => {
  const content = useSignal('')

  return (
    <form
      onSubmit$={async () => {
        const newPost = await addPost({ content: content.value })

        content.value = ''

        posts.unshift(newPost.data)
      }}
      preventdefault:submit
    >
      <input bind:value={content} class="bg-transparent" />
      <button type="submit">Post</button>
    </form>
  )
})
