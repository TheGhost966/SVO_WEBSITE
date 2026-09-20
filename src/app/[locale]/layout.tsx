import type { Metadata } from 'next'
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

  const messages = await getMessages()
  const isRtl = isRtlLocale(locale)

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
