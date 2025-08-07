import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { preloadQuery } from 'convex/nextjs'
import { api } from './_generated/api'

export const getPreloadedUser = async (token?: string) => {
  const tokenToUse = token ?? (await convexAuthNextjsToken())
  const preloadedUser = await preloadQuery(api.users.getCurrentUser, {}, { token: tokenToUse })
  return preloadedUser
}
