import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'

const UnauthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await convexAuthNextjsToken()
  console.log(user)
  return <>{children}</>
}

export default UnauthenticatedLayout
