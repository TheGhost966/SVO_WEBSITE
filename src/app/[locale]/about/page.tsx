import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { buildMetadata } from '@/lib/seo'
import { getPageBySlug } from '@/lib/queries'

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

// The About page is identified by the fixed slug 'about' across all locales.
// Editors must not change this slug — it's documented in CONTENT-NEEDED.md.
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
          {locale === 'ar' ? 'من نحن' : locale === 'en' ? 'About us' : 'Über uns'}
        </h1>
        <div className="p-6 rounded-card border-2 border-dashed border-brand-blue/30 bg-brand-blue/5">
          <p className="text-brand-blue font-semibold text-sm mb-1">⚠ Inhalt ausstehend</p>
          <p className="text-ink-70 text-sm">
            [{locale.toUpperCase()}] Die Seite &ldquo;Über uns&rdquo; wird über den Admin-Bereich befüllt.
            Slug: <code className="bg-white px-1 rounded text-xs">{ABOUT_SLUG}</code>
          </p>
        </div>
      </div>
    )
  }

  return <BlockRenderer blocks={blocks} locale={locale} />
}
