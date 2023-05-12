import { component$ } from '@builder.io/qwik'
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city'
import { getDb } from '../db/db'
import { users } from '../db/schema'

export const useUsers = routeLoader$(async (reqEvent) => {
  const db = getDb(reqEvent)

  const allUsers = await db.select().from(users)

  return allUsers
})

export default component$(() => {
  const { value: users } = useUsers()

  return (
    <div>
      <h1>hello Qwik</h1>
      <h4>users server with drizzled from planetscale:</h4>
      {users.map((user) => (
        <div key={user.id}>{user.fullName}</div>
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
