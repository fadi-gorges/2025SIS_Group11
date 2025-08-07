import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { fetchQuery } from 'convex/nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { api } from '../../../convex/_generated/api'
import { getPreloadedUser } from '../../../convex/serverUtils'

const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true'

  const token = await convexAuthNextjsToken()
  const isAuthenticated = await fetchQuery(api.auth.isAuthenticated, {}, { token })

  if (!isAuthenticated) {
    redirect('/login')
  }

  const preloadedUser = await getPreloadedUser(token)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar preloadedUser={preloadedUser} />
      <SidebarInset className="gap-4">{children}</SidebarInset>
    </SidebarProvider>
  )
}

export default AuthenticatedLayout
