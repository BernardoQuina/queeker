import type { RequestEventBase, RequestEventLoader } from '@builder.io/qwik-city'
import { postsApi } from './posts'
import { likesApi } from './likes'
import { usersApi } from './user'

export const api = (req: RequestEventLoader | RequestEventBase) => {
  return {
    posts: postsApi(req),
    likes: likesApi(req),
    users: usersApi(req),
  }
}
