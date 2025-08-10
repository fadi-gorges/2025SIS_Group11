import AuthRoute from '@/components/auth/auth-route'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { cookies } from 'next/headers'
import NextTopLoader from 'nextjs-toploader'

const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <AuthRoute allow="authenticated">
      <NextTopLoader showSpinner={false} />
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className="h-svh overflow-hidden">{children}</SidebarInset>
      </SidebarProvider>
    </AuthRoute>
  )
}

export default AuthenticatedLayout
