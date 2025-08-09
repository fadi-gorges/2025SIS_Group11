'use client'

import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { api } from '../../../convex/_generated/api'

type AuthRouteProps = {
  allow: 'authenticated' | 'unauthenticated'
  children: React.ReactNode
}

const AuthRoute = ({ allow, children }: AuthRouteProps) => {
  const isAuthenticated = useQuery(api.users.isAuthenticated)
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated === undefined) {
      return
    }
    if (allow === 'authenticated' && !isAuthenticated) {
      router.push('/login')
    }
    if (allow === 'unauthenticated' && isAuthenticated) {
      router.push('/')
    }
  }, [allow, isAuthenticated, router])

  if (
    isAuthenticated === undefined ||
    (allow === 'authenticated' && !isAuthenticated) ||
    (allow === 'unauthenticated' && isAuthenticated)
  ) {
    return null
  }

  return children
}

export default AuthRoute
