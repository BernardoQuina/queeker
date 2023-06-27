import { type RequestEventBase, type RequestEventLoader, z } from '@builder.io/qwik-city'
import { eq } from 'drizzle-orm'

import { getDb } from '../db/db'
import { users } from '../db/schema'

const getByIdParams = z.object({
  username: z.string(),
})

type GetByIdParams = z.infer<typeof getByIdParams>

const createInput = z.object({
  username: z.string(),
  displayName: z.string().optional().nullable(),
  image: z.string(),
})

type CreateInput = z.infer<typeof createInput>

export const usersProcedures = ({ env }: RequestEventLoader | RequestEventBase) => {
  return {
    query: {
      getByUsername: async ({ username }: GetByIdParams) => {
        try {
          const db = getDb({ env })

          const user = await db.query.users.findFirst({
            where: eq(users.username, username),
          })

          if (!user) return { code: 404, message: 'User not found', data: null }

          return { code: 200, message: 'success', data: { user } }
        } catch (error) {
          let message = 'Oops, something went wrong. Please try again later.'

          if (error instanceof Error) message = error.message

          return { code: 500, message, data: null }
        }
      },
    },
    mutations: {
      create: async ({ username, displayName, image }: CreateInput) => {
        try {
          const db = getDb({ env })

          const createUser = await db.insert(users).values({
            username: username.toLowerCase(),
            displayName,
            image,
          })

          return {
            code: 200,
            message: 'success',
            data: { userId: parseInt(createUser.insertId) },
          }
        } catch (error) {
          let message = 'Oops, something went wrong. Please try again later.'

          if (error instanceof Error) message = error.message

          return { code: 500, message, data: null }
        }
      },
    },
  }
}
