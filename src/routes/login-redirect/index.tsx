import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async (reqEvent) => {
  if (reqEvent.env.get('NODE_ENV') === 'development') {
    throw reqEvent.redirect(302, 'http://127.0.0.1:5173')
  } else {
    throw reqEvent.redirect(302, 'https://qwik-drizzle.vercel.app')
  }
}
