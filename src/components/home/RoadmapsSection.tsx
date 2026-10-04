import { Link } from '@/i18n/navigation'
import { Icon } from '@/components/ui/Icon'
import { forwardArrow } from '@/i18n/routing'
import type { RoadmapDoc } from '@/types/payload'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'

/**
 * Figma 3.png: white section, cream cards — step-count pill + icon tile on top, title, the
 * responsible authority, the first three numbered steps, "more steps …", navy start button.
 * The Figma's green "What's my situation? — 4 questions" band sits under the cards and leads to
 * the real four-question flow at /quiz (src/lib/quiz.ts, src/components/ui/SituationQuiz.tsx).
 */
export function RoadmapsSection({
  locale,
  roadmaps,
  quizReady,
  t,
}: {
  locale: string
  roadmaps: RoadmapDoc[]
  /** False while some quiz answers would find no roadmap — the band is then left out. */
  quizReady: boolean
  t: (key: string) => string
}) {
  if (roadmaps.length === 0) return null
  const copy = homeCopy(locale)
  const shown = roadmaps.slice(0, 3)

  return (
    <HomeSectionShell id="roadmaps-heading" bg="bg-surface">
      <SectionHead
        id="roadmaps-heading"
        eyebrow={copy.eyebrow.roadmaps}
        title={t('roadmapsHeading')}
        subtitle={copy.roadmapsSubtitle}
        action={{ href: '/roadmaps', label: t('allRoadmaps') }}
        locale={locale}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((roadmap) => {
          const steps = (roadmap.steps ?? []).filter((s) => s?.title)
          const authority = steps[0]?.responsibleAuthority
          return (
            <article
              key={roadmap.id}
              className="flex flex-col rounded-[22px] border border-border bg-cream p-6 md:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                {steps.length > 0 && (
                  <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-brand-blue">
                    {copy.stepsCount(steps.length)}
                  </span>
                )}
                <span className="ms-auto flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-brand-blue">
                  <Icon name={roadmap.icon ?? 'compass'} fallback="🧭" className="h-5 w-5" />
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-bold leading-snug text-ink">{roadmap.title}</h3>
              {authority && <p className="mt-1 text-sm text-ink-50">{authority}</p>}
              {steps.length > 0 && (
                <ol className="mt-5 flex flex-col gap-3">
                  {steps.slice(0, 3).map((step, i) => (
                    <li key={step.id ?? i} className="flex items-center gap-3 text-sm text-ink">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          i === 0 ? 'bg-brand-green text-white' : 'border border-border bg-surface text-ink-70'
                        }`}
                        aria-hidden="true"
                      >
                        {i + 1}
                      </span>
                      <span className="leading-snug">{step.title}</span>
                    </li>
                  ))}
                  {steps.length > 3 && <li className="ps-9 text-sm text-ink-50">{copy.moreSteps}</li>}
                </ol>
              )}
              <Link
                href={{ pathname: '/roadmaps/[roadmap]', params: { roadmap: roadmap.slug ?? '' } }}
                className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue"
              >
                {copy.startRoadmap}
                <span aria-hidden="true">{forwardArrow(locale)}</span>
              </Link>
            </article>
          )
        })}
      </div>

      {/* Figma 3.png's green band under the cards. Real, not decorative: it leads to the
          four-question flow at /quiz, which ranks these same roadmaps by the tags the board sets
          on each one. */}
      {quizReady && (
      <div className="mt-8 flex flex-col items-start gap-5 rounded-[22px] bg-brand-green-lt p-7 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h3 className="text-xl font-bold text-[#1F5E1B] md:text-2xl">{copy.quiz.heading}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#2E6B29]">{copy.quiz.body}</p>
        </div>
        <Link
          href="/quiz"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-green px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dk"
        >
          {copy.quiz.button}
          <span aria-hidden="true">{forwardArrow(locale)}</span>
        </Link>
      </div>
      )}
    </HomeSectionShell>
  )
}
