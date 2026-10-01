import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { getRoadmaps, getExperts } from '@/lib/queries'
import { homeCopy } from '@/components/home/copy'
import { SituationQuiz, type QuizRoadmap, type QuizExpert } from '@/components/ui/SituationQuiz'
import { SmartLink } from '@/components/ui/SmartLink'
import { forwardArrow } from '@/i18n/routing'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const copy = homeCopy(locale)
  return { title: copy.quiz.heading, description: copy.quiz.body }
}

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'ar' }, { locale: 'en' }]
}

/**
 * The "Was ist meine Situation?" flow (Figma 3.png's green band links here).
 *
 * Server component: it fetches the roadmaps and experts once, prerenders the page shell, and
 * hands the data to a client component that does the four questions in the browser. Nothing the
 * visitor answers is sent anywhere — see the comment in `SituationQuiz` for why that matters.
 *
 * Locale-correct hrefs are resolved here with `getPathname` rather than inside the client
 * component, so the routing table stays the single source of truth for paths and the client
 * bundle doesn't need it.
 */
export default async function QuizPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const copy = homeCopy(locale)
  const loc = locale as 'de' | 'ar' | 'en'

  const [roadmaps, experts] = await Promise.all([getRoadmaps(locale, 100), getExperts(locale, undefined, 100)])

  const quizRoadmaps: QuizRoadmap[] = roadmaps
    .filter((r) => r.slug)
    .map((r) => ({
      id: String(r.id),
      href: getPathname({ href: { pathname: '/roadmaps/[roadmap]', params: { roadmap: r.slug! } }, locale: loc }),
      title: r.title ?? '',
      description: r.description,
      stepCount: (r.steps ?? []).filter((s) => s?.title).length,
      quizMatches: r.quizMatches ?? [],
    }))

  const quizExperts: QuizExpert[] = experts
    .filter((e) => e.slug)
    .map((e) => ({
      id: String(e.id),
      href: getPathname({ href: { pathname: '/experts/[slug]', params: { slug: e.slug! } }, locale: loc }),
      name: e.name ?? '',
      city: e.city,
      bundesland: e.bundesland,
    }))

  return (
    <div
      className="mx-auto max-w-[900px] py-12 md:py-[84px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-green-dk">
        {copy.eyebrow.roadmaps}
      </p>
      <h1 className="mt-3 text-3xl font-bold leading-tight text-ink md:text-4xl">{copy.quiz.heading}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-70">{copy.quiz.body}</p>

      <div className="mt-8">
        <SituationQuiz
          locale={locale}
          roadmaps={quizRoadmaps}
          experts={quizExperts}
          allRoadmapsHref={getPathname({ href: '/roadmaps', locale: loc })}
          allExpertsHref={getPathname({ href: '/experts', locale: loc })}
          contactHref={getPathname({ href: '/contact', locale: loc })}
        />
      </div>

      {/* The questions need JavaScript; the roadmaps they lead to do not. Without it, this is the
          same content one level less convenient, rather than a dead page. */}
      <noscript>
        <div className="mt-6 rounded-2xl border border-border bg-cream p-5">
          <p className="text-sm text-ink-70">{copy.roadmapsSubtitle}</p>
          <SmartLink
            href={getPathname({ href: '/roadmaps', locale: loc })}
            className="mt-3 inline-block text-sm font-semibold text-brand-blue"
          >
            {copy.eyebrow.roadmaps} {forwardArrow(locale)}
          </SmartLink>
        </div>
      </noscript>
    </div>
  )
}
