import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async (reqEvent) => {
  throw reqEvent.redirect(302, 'http://127.0.0.1:5173/')
}
