import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match all paths EXCEPT:
  // - /api  (Payload REST API)
  // - /admin (Payload admin panel)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - Static files with extensions (fonts, images, etc.)
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
}
