import AuthRoute from '@/components/auth/auth-route'

const UnauthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  return <AuthRoute allow="unauthenticated">{children}</AuthRoute>
}

export default UnauthenticatedLayout
