import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
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
  const isRtl = locale === 'ar'

  return (
    <>
      {/*
        Sets lang and dir on the root <html> element synchronously before
        React hydration — prevents a flash of wrong text direction on Arabic.
        suppressHydrationWarning on <html> (in root layout) prevents the mismatch warning.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang='${locale}';document.documentElement.dir='${isRtl ? 'rtl' : 'ltr'}';`,
        }}
      />
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
    </>
  )
}
