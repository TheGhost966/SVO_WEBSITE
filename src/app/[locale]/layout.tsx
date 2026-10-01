import type { Metadata } from 'next'
import { preload } from 'react-dom'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing, isRtlLocale } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CookieConsent } from '@/components/ui/CookieConsent'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'),
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'de' | 'ar' | 'en')) notFound()

  setRequestLocale(locale)

  const allMessages = await getMessages()
  const isRtl = isRtlLocale(locale)

  // `getMessages()` returns all 16 namespaces, and everything handed to NextIntlClientProvider is
  // serialised into the RSC payload of every page — so the browser was downloading the copy for
  // news, events, services, guide, roadmaps, jobs, search, partners, legal and footer purely to
  // render a nav bar. Server components call `getTranslations` and read messages directly on the
  // server, so they are unaffected by this; only `useTranslations` in a client component reads
  // from the provider.
  //
  // KEEP IN SYNC: adding `useTranslations('x')` to a `'use client'` component means adding `'x'`
  // here, or that component throws MISSING_MESSAGE at runtime. Current client consumers:
  //   nav      → components/layout/Header.tsx
  //   contact  → components/ui/ContactForm.tsx
  //   experts  → components/ui/ExpertApplicationForm.tsx
  const CLIENT_NAMESPACES = ['nav', 'contact', 'experts'] as const
  const messages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in allMessages).map((ns) => [ns, allMessages[ns]]),
  )

  // The @font-face rules live in globals.css, so the browser only discovers the font files
  // after it has downloaded and parsed that stylesheet — text sits in the fallback face until
  // then, and swaps late. Preloading the two faces that are certain to paint above the fold
  // (body 400 + heading 700 of the locale's own script) starts those fetches in parallel with
  // the CSS. Deliberately only two: every extra preload competes with the ones that matter.
  //
  // Via react-dom's `preload` rather than a literal <link>: React hoists a rendered <link> into
  // <head> but also leaves the original in place, so the tag was emitted twice.
  const preloadFonts = isRtl
    ? ['/fonts/cairo/cairo-arabic-400-normal.woff2', '/fonts/cairo/cairo-arabic-700-normal.woff2']
    : ['/fonts/inter/inter-latin-400-normal.woff2', '/fonts/inter/inter-latin-700-normal.woff2']
  for (const href of preloadFonts) {
    preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
  }

  return (
    // This route group provides its own complete document (Next.js "multiple
    // root layouts" pattern) because the sibling (payload) group needs its
    // own — Payload's admin RootLayout renders its own <html>/<body>, so a
    // shared app/layout.tsx above both groups would nest <html> inside
    // <body>. lang/dir are known server-side from the route param, so they're
    // set directly here rather than patched in via a pre-hydration script.
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <div className="min-h-screen flex flex-col bg-cream text-ink font-sans">
            <a href="#main-content" className="skip-to-content">
              {locale === 'ar' ? 'انتقل إلى المحتوى' : locale === 'en' ? 'Skip to content' : 'Zum Inhalt springen'}
            </a>
            <Header locale={locale} />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer locale={locale} />
            <CookieConsent locale={locale} />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
