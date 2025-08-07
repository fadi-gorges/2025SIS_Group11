import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { fetchQuery } from 'convex/nextjs'
import { redirect } from 'next/navigation'
import { api } from '../../../convex/_generated/api'

const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const token = await convexAuthNextjsToken()
  const isAuthenticated = await fetchQuery(api.auth.isAuthenticated, {}, { token })

  if (!isAuthenticated) {
    redirect('/login')
  }

  return <>{children}</>
}

export default AuthenticatedLayout
