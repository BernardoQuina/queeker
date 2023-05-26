import type { RequestEventBase, RequestEventLoader } from '@builder.io/qwik-city'
import { postsProcedures } from './posts'
import { likesProcedures } from './likes'
import { usersProcedures } from './user'

export const procedures = (req: RequestEventLoader | RequestEventBase) => {
  return {
    posts: postsProcedures(req),
    likes: likesProcedures(req),
    users: usersProcedures(req),
  }
}
