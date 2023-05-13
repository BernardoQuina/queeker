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
    clerkId: varchar('clerk_id', { length: 256 }).notNull(),
    fullName: text('full_name').notNull(),
    username: varchar('username', { length: 256 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (user) => ({
    uniqueUsername: uniqueIndex('unique_username').on(user.username),
    uniqueClerkId: uniqueIndex('unique_clerk_id').on(user.clerkId),
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
