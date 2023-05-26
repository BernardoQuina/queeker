import { relations, type InferModel } from 'drizzle-orm'
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

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const posts = mysqlTable('posts', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  userId: int('user_id').notNull(),
  replyToPostId: int('reply_to_post_id'),
  repostOfPostId: int('repost_of_post_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.userId], references: [users.id] }),
  replyToPost: one(posts, { fields: [posts.replyToPostId], references: [posts.id] }),
  repostOfPost: one(posts, { fields: [posts.repostOfPostId], references: [posts.id] }),
  likes: many(likes),
}))

export const likes = mysqlTable('likes', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull(),
  postId: int('post_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
}))

//
// Types
//

export type User = InferModel<typeof users>
export type Post = InferModel<typeof posts>
export type Like = InferModel<typeof likes>

export type PostWithUserAndLikeCount = Post & { author: User | null } & {
  likeCount: string
  userLiked: 1 | 0
}
