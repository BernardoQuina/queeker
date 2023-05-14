import { component$, useSignal } from '@builder.io/qwik'
import { server$, z } from '@builder.io/qwik-city'
import { eq } from 'drizzle-orm'

import { getDb } from '../../db/db'
import { type Post, posts } from '../../db/schema'

const postInput = z.object({
  content: z.string(),
})

type PostInput = z.infer<typeof postInput>

export const addPost = server$(async function (post: PostInput) {
  const db = getDb({ env: this.env })

  const newPostQuery = await db.insert(posts).values({
    content: post.content,
    userId: 1,
  })

  const newPost = await db
    .select()
    .from(posts)
    .where(eq(posts.id, parseInt(newPostQuery.insertId)))

  return { success: true, data: newPost[0] }
})

interface Props {
  posts: Post[]
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
