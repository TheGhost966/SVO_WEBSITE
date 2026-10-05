import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { buildMetadata } from '@/lib/seo'
import { getPageBySlug } from '@/lib/queries'

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

// The About page is identified by the fixed slug 'about' across all locales.
// Editors must not change this slug (see ADMIN-HANDBUCH.md).
const ABOUT_SLUG = 'about'

const ABOUT_TITLES: Record<string, string> = {
  de: 'Über uns — SVÖ',
  ar: 'من نحن — الاتحاد السوري في النمسا',
  en: 'About us — SVÖ',
}

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const page = await getPageBySlug(ABOUT_SLUG, locale)
  const base = locale === 'de' ? '/de/ueber-uns' : `/${locale}/about`
  return page
    ? {
        ...buildMetadata({ doc: page, locale, fallbackTitle: ABOUT_TITLES[locale], serverUrl: SERVER }),
        alternates: {
          languages: {
            de: `${SERVER}/de/ueber-uns`,
            ar: `${SERVER}/ar/about`,
            en: `${SERVER}/en/about`,
          },
          canonical: `${SERVER}${base}`,
        },
      }
    : {
        title: ABOUT_TITLES[locale],
        alternates: {
          languages: {
            de: `${SERVER}/de/ueber-uns`,
            ar: `${SERVER}/ar/about`,
            en: `${SERVER}/en/about`,
          },
        },
      }
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const page = await getPageBySlug(ABOUT_SLUG, locale)
  const blocks = page?.layout ?? []

  if (blocks.length === 0) {
    return (
      <div
        className="py-12 md:py-[84px] mx-auto max-w-[1200px] max-w-3xl"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <h1 className="text-3xl font-bold text-ink mb-4">
          {page?.title || (locale === 'ar' ? 'من نحن' : locale === 'en' ? 'About us' : 'Über uns')}
        </h1>
        {/* No content yet (no page with the slug "about", or one without layout blocks). Visitors
            get a sentence in their language, not a note addressed to the editors — that is on the
            admin dashboard ("Was noch fehlt"). */}
        <p className="text-ink-70">
          {locale === 'ar'
            ? 'محتوى هذه الصفحة قيد الإعداد وسيُنشر قريبًا.'
            : locale === 'en'
              ? 'This page is being prepared and will be published soon.'
              : 'Diese Seite wird gerade vorbereitet und folgt in Kürze.'}
        </p>
      </div>
    )
  }

  return <BlockRenderer blocks={blocks} locale={locale} />
}
