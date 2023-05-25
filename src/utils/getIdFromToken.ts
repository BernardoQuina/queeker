import { decode } from '@auth/core/jwt'
import type { Cookie, RequestEventAction } from '@builder.io/qwik-city'

interface GetIdParams {
  cookie: Cookie
  env: RequestEventAction['env']
}

export const getIdFromToken = async ({ cookie, env }: GetIdParams) => {
  const sessionToken =
    env.get('NODE_ENV') === 'development'
      ? cookie.get('next-auth.session-token')
      : cookie.get('__Secure-next-auth.session-token')

  if (!sessionToken || !sessionToken?.value) return null

  const decoded = await decode({
    token: sessionToken.value,
    secret: env.get('AUTH_SECRET') as string,
  })

  const id = decoded?.name?.split('db_id:')[1]

  if (!id) return null

  return parseInt(id)
}
