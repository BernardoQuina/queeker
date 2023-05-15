import type { InferModel } from 'drizzle-orm'
import {
  int,
  mysqlTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

export const users = mysqlTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 256 }).notNull(),
    displayName: text('display_name'),
    image: text('image').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (user) => ({
    uniqueUsername: uniqueIndex('unique_username').on(user.username),
  })
)

export type User = InferModel<typeof users>

export const posts = mysqlTable('posts', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  userId: int('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type Post = InferModel<typeof posts>

export type PostWithUser = Post & { user: User | null }

export const postWithUserSelect = {
  id: posts.id,
  content: posts.content,
  createdAt: posts.createdAt,
  userId: posts.userId,
  user: users,
}
