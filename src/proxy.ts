import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

/**
 * The first language is always German. Both the public site (next-intl) and the admin panel
 * (Payload) would otherwise pick the language from the browser's `Accept-Language` header, so a
 * browser set to English opened the site in English. Without that header each falls back to its
 * default, German — and a language the visitor chooses themselves still wins, because that choice
 * is kept in a cookie (`NEXT_LOCALE` on the site, `payload-lng` in the admin panel).
 */
export default function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.delete('accept-language')

  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next({ request: { headers } })
  }
  return handleI18nRouting(new NextRequest(request, { headers }))
}

export const config = {
  // Match all paths EXCEPT:
  // - /api  (Payload REST API)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - Static files with extensions (fonts, images, etc.)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
