import { component$, useSignal, useStore } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$, z, server$ } from '@builder.io/qwik-city'
import { desc, eq } from 'drizzle-orm'

import { posts } from '../db/schema'
import { getDb } from '../db/db'

export const usePosts = routeLoader$(async (reqEvent) => {
  try {
    const db = getDb(reqEvent)

    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt))

    return allPosts
  } catch (error) {
    console.log(error)
  }
})

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

export default component$(() => {
  const postsSignal = usePosts()

  if (!postsSignal.value) return <div>not possible to retrieve posts</div>

  const posts = useStore(postsSignal.value)

  const content = useSignal('')

  return (
    <div>
      <h1>hello Qwik</h1>
      <h4>posts served with drizzled from planetscale:</h4>
      <form
        onSubmit$={async () => {
          const newPost = await addPost({ content: content.value })

          content.value = ''

          posts.unshift(newPost.data)
        }}
        preventdefault:submit
      >
        <input bind:value={content} />
        <button type="submit">Post</button>
      </form>
      {posts.map((post) => (
        <div key={post.id}>{post.content}</div>
      ))}
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Welcome to Qwik',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
}
