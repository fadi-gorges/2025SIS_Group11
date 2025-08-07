import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'

export default convexAuthNextjsMiddleware(() => {}, {
  cookieConfig: {
    maxAge: 60 * 60 * 24 * 30,
  },
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
