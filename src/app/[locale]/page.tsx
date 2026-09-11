import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { NewsCard } from '@/components/ui/NewsCard'
import { EventCard } from '@/components/ui/EventCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ButtonLink } from '@/components/ui/Button'
import { buildMetadata } from '@/lib/seo'
import {
  getPageBySlug,
  getLatestNews,
  getUpcomingEvents,
  getServicePillars,
} from '@/lib/queries'
import type { ServicePillarDoc } from '@/types/payload'

type Props = { params: Promise<{ locale: string }> }

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const page = await getPageBySlug('home', locale)
  if (page?.seo ?? null) {
    return buildMetadata({ doc: page as any, locale })
  }
  const titles: Record<string, string> = {
    de: 'SVÖ — Syrischer Verband in Österreich',
    ar: 'الاتحاد السوري في النمسا',
    en: 'SVÖ — Syrian Association in Austria',
  }
  const descs: Record<string, string> = {
    de: 'Bauen. Verbinden. Umsetzen. — Der SVÖ unterstützt die syrische Gemeinschaft in Österreich.',
    ar: 'نبني · نربط · ننفذ — الاتحاد السوري في النمسا يدعم المجتمع السوري.',
    en: 'Building. Connecting. Delivering. — SVÖ supports the Syrian community in Austria.',
  }
  return { title: titles[locale], description: descs[locale] }
}

// ─── Pillar icons (fallback emoji when no Lucide icon is loaded yet) ──────────

const pillarIconFallback: Record<string, string> = {
  'graduation-cap': '🎓',
  trophy: '🏆',
  heart: '❤️',
  scale: '⚖️',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')

  // Fetch all data in parallel — graceful empty arrays on DB not yet connected
  const [page, newsResult, eventsResult, pillarsResult] = await Promise.all([
    getPageBySlug('home', locale),
    getLatestNews(locale, 3),
    getUpcomingEvents(locale, 3),
    getServicePillars(locale),
  ])

  const blocks = page?.layout ?? []
  const news = newsResult.docs
  const events = eventsResult.docs
  const pillars = pillarsResult.docs

  return (
    <>
      {/* ── Page builder blocks (Hero, about section, etc.) ────────────────── */}
      {blocks.length > 0 ? (
        <BlockRenderer blocks={blocks} locale={locale} />
      ) : (
        <FallbackHero locale={locale} />
      )}

      {/* ── Service pillars ──────────────────────────────────────────────────── */}
      {pillars.length > 0 && (
        <PillarsSection pillars={pillars} t={t} locale={locale} />
      )}

      {/* ── Latest news ──────────────────────────────────────────────────────── */}
      {news.length > 0 && (
        <section className="py-12 md:py-[84px] bg-cream" aria-labelledby="news-heading">
          <div
            className="mx-auto max-w-[1200px]"
            style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
          >
            <div className="flex items-end justify-between gap-4 mb-8">
              <SectionHeader title={t('latestNews')} as="h2" />
              <Link
                href="/news"
                className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0"
              >
                {t('allNews')} →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((article) => (
                <NewsCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Upcoming events ──────────────────────────────────────────────────── */}
      {events.length > 0 && (
        <section className="py-12 md:py-[84px] bg-surface" aria-labelledby="events-heading">
          <div
            className="mx-auto max-w-[1200px]"
            style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
          >
            <div className="flex items-end justify-between gap-4 mb-8">
              <SectionHeader title={t('upcomingEvents')} as="h2" />
              <Link
                href="/events"
                className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0"
              >
                {t('allEvents')} →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA band when no page builder content yet ─────────────────────── */}
      {blocks.length === 0 && <DefaultCTABand locale={locale} />}
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FallbackHero({ locale }: { locale: string }) {
  const headlines: Record<string, { h1: string; sub: string; body: string }> = {
    de: {
      h1: 'SVÖ — Syrischer Verband in Österreich',
      sub: 'Bauen. Verbinden. Umsetzen.',
      body: '[DE] Startseite — Inhalte werden nach Redaktionsfreigabe sichtbar.',
    },
    ar: {
      h1: 'الاتحاد السوري في النمسا',
      sub: 'نبني · نربط · ننفذ',
      body: '[AR] محتوى الصفحة الرئيسية سيظهر بعد موافقة مجلس الإدارة.',
    },
    en: {
      h1: 'SVÖ — Syrian Association in Austria',
      sub: 'Building. Connecting. Delivering.',
      body: '[EN] Homepage content will appear after editorial approval.',
    },
  }
  const c = headlines[locale] ?? headlines.de

  return (
    <section className="bg-brand-navy py-20 md:py-[84px]">
      <div
        className="mx-auto max-w-[1200px] max-w-2xl"
        style={{ paddingInlineStart: 'clamp(24px, 8vw, 120px)', paddingInlineEnd: 'clamp(24px, 8vw, 120px)' }}
      >
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{c.h1}</h1>
        <p className="mt-4 text-lg text-white/80 font-medium">{c.sub}</p>
        <p className="mt-3 text-sm text-white/50">{c.body}</p>
      </div>
    </section>
  )
}

function PillarsSection({
  pillars,
  t,
  locale,
}: {
  pillars: ServicePillarDoc[]
  t: Awaited<ReturnType<typeof getTranslations<'home'>>>
  locale: string
}) {
  return (
    <section className="py-12 md:py-[84px] bg-surface" aria-labelledby="services-heading">
      <div
        className="mx-auto max-w-[1200px]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <div className="flex items-end justify-between gap-4 mb-8">
          <SectionHeader title={t('ourServices')} as="h2" />
          <Link href="/services" className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0">
            {t('allServices')} →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => {
            const emoji = pillarIconFallback[pillar.icon ?? ''] ?? '📋'
            return (
              <Link
                key={pillar.id}
                href={{ pathname: '/services/[pillar]', params: { pillar: pillar.slug ?? pillar.id } }}
                className="group bg-surface rounded-card border border-border p-6 flex flex-col gap-3 hover:border-brand-blue hover:shadow-md transition-all"
              >
                <span className="text-3xl" aria-hidden="true">{emoji}</span>
                <h3 className="font-semibold text-ink group-hover:text-brand-blue transition-colors">
                  {pillar.title}
                </h3>
                {pillar.description && (
                  <p className="text-sm text-ink-70 line-clamp-3">{pillar.description}</p>
                )}
                <span className="text-sm font-semibold text-brand-blue mt-auto">
                  {locale === 'ar' ? 'اعرف المزيد' : locale === 'en' ? 'Learn more' : 'Mehr erfahren'} →
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function DefaultCTABand({ locale }: { locale: string }) {
  const content: Record<string, { heading: string; sub: string; btn: string }> = {
    de: { heading: 'Kontaktieren Sie uns', sub: 'Haben Sie Fragen oder möchten Sie mehr erfahren?', btn: 'Jetzt Kontakt aufnehmen' },
    ar: { heading: 'تواصل معنا', sub: 'هل لديك أسئلة أو تريد معرفة المزيد؟', btn: 'اتصل بنا الآن' },
    en: { heading: 'Get in touch', sub: 'Have questions or want to learn more?', btn: 'Contact us now' },
  }
  const c = content[locale] ?? content.de
  return (
    <section className="bg-brand-green py-16 md:py-20">
      <div
        className="mx-auto max-w-[1200px] text-center"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <h2 className="text-2xl md:text-4xl font-bold text-white">{c.heading}</h2>
        <p className="mt-4 text-white/80">{c.sub}</p>
        <div className="mt-8">
          <ButtonLink href={`/${locale === 'de' ? 'kontakt' : 'contact'}`} variant="secondary" size="lg">
            {c.btn}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
