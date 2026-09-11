import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { inter, cairo } from '@/lib/fonts'
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

  // Validate locale
  if (!routing.locales.includes(locale as any)) notFound()

  // Enable static rendering for this locale
  setRequestLocale(locale)

  const messages = await getMessages()
  const isRtl = locale === 'ar'

  // Only load Cairo font class for Arabic locale
  const fontClassNames = isRtl
    ? `${inter.variable} ${cairo.variable}`
    : inter.variable

  return (
    <>
      {/*
        We set lang and dir as a script before React hydrates to avoid
        a flash of wrong direction. The html element itself is in the root layout.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.documentElement.lang = '${locale}';
            document.documentElement.dir = '${isRtl ? 'rtl' : 'ltr'}';
          `,
        }}
      />
      <NextIntlClientProvider messages={messages} locale={locale}>
        <div className={`${fontClassNames} min-h-screen flex flex-col`}>
          <a href="#main-content" className="skip-to-content">
            {/* Translation available once client-side — static fallback: */}
            Zum Inhalt springen
          </a>
          <Header locale={locale} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} />
          <CookieConsent locale={locale} />
        </div>
      </NextIntlClientProvider>
    </>
  )
}
