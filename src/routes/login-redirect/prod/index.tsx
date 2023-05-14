import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async (reqEvent) => {
  throw reqEvent.redirect(302, 'https://qwik-drizzle.vercel.app/')
}
