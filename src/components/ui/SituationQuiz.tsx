'use client'

import { useMemo, useState } from 'react'
import { QUIZ_QUESTIONS, tagsForAnswers, rankByTags, type QuizAnswers, type QuizQuestionId } from '@/lib/quiz'
import { SmartLink } from './SmartLink'
import { forwardArrow, backArrow } from '@/i18n/routing'

type Lang = 'de' | 'ar' | 'en'

export type QuizRoadmap = {
  id: string
  /** Locale-correct path, resolved on the server — see the note on the component's props. */
  href: string
  title: string
  description?: string | null
  stepCount: number
  quizMatches?: string[] | null
}

export type QuizExpert = {
  id: string
  href: string
  name: string
  city?: string | null
  bundesland?: string | null
}

const UI: Record<Lang, Record<string, string>> = {
  de: {
    step: 'Frage',
    of: 'von',
    back: 'Zurück',
    skip: 'Überspringen',
    restart: 'Von vorne beginnen',
    resultsTitle: 'Das passt zu Ihrer Situation',
    resultsNone:
      'Zu diesen Antworten gibt es derzeit keine passende Anleitung. Das heißt nicht, dass wir Ihnen nicht helfen können — schreiben Sie uns, oder sehen Sie sich alle Anleitungen an.',
    allRoadmaps: 'Alle Anleitungen ansehen',
    contact: 'Schreiben Sie uns',
    expertsNearby: 'Expert:innen in Ihrer Nähe',
    allExperts: 'Alle Expert:innen',
    steps: 'Schritte',
    open: 'Anleitung öffnen',
    matchOne: 'passt zu einer Ihrer Antworten',
    matchMany: 'passt zu mehreren Ihrer Antworten',
  },
  ar: {
    step: 'سؤال',
    of: 'من',
    back: 'رجوع',
    skip: 'تخطٍ',
    restart: 'ابدأ من جديد',
    resultsTitle: 'هذا يناسب وضعك',
    resultsNone:
      'لا يوجد حالياً مسار يطابق هذه الإجابات. هذا لا يعني أننا لا نستطيع مساعدتك — راسلنا أو اطّلع على جميع المسارات.',
    allRoadmaps: 'عرض جميع المسارات',
    contact: 'راسلنا',
    expertsNearby: 'خبراء بالقرب منك',
    allExperts: 'جميع الخبراء',
    steps: 'خطوات',
    open: 'افتح المسار',
    matchOne: 'يطابق إحدى إجاباتك',
    matchMany: 'يطابق عدة من إجاباتك',
  },
  en: {
    step: 'Question',
    of: 'of',
    back: 'Back',
    skip: 'Skip',
    restart: 'Start again',
    resultsTitle: 'This fits your situation',
    resultsNone:
      'There is no matching roadmap for these answers right now. That does not mean we cannot help — write to us, or browse all roadmaps.',
    allRoadmaps: 'See all roadmaps',
    contact: 'Write to us',
    expertsNearby: 'Experts near you',
    allExperts: 'All experts',
    steps: 'steps',
    open: 'Open roadmap',
    matchOne: 'matches one of your answers',
    matchMany: 'matches several of your answers',
  },
}

/**
 * The four-question situation quiz from Figma 3.png.
 *
 * Runs entirely in the browser against data the server already fetched — no accounts, no
 * submissions, nothing stored. That matters twice over: the project has no user accounts by
 * design, and answers here ("I am new in Austria", "I am looking for work") are exactly the kind
 * of personal circumstance that should not be written to a database nobody asked to be in.
 *
 * Results are a plain tag intersection (`rankByTags`) over roadmaps the board has tagged. A
 * roadmap with no matching tag is left out rather than padded in, so an empty result is shown
 * honestly with a route to the contact form instead of a confident-looking wrong suggestion.
 */
export function SituationQuiz({
  locale,
  roadmaps,
  experts,
  allRoadmapsHref,
  allExpertsHref,
  contactHref,
}: {
  locale: string
  /**
   * Each item carries its own resolved `href`. The paths are built on the server with
   * `getPathname` so the routing table stays the one source of truth — and they arrive as plain
   * strings because a function cannot be handed across the server/client boundary.
   */
  roadmaps: QuizRoadmap[]
  experts: QuizExpert[]
  allRoadmapsHref: string
  allExpertsHref: string
  contactHref: string
}) {
  const lang: Lang = locale === 'ar' ? 'ar' : locale === 'en' ? 'en' : 'de'
  const t = UI[lang]
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})

  const done = step >= QUIZ_QUESTIONS.length
  const tags = useMemo(() => (done ? tagsForAnswers(answers) : []), [done, answers])
  const ranked = useMemo(() => rankByTags(roadmaps, tags), [roadmaps, tags])

  const nearbyExperts = useMemo(() => {
    const state = answers.bundesland
    if (!state) return []
    return experts.filter((e) => e.bundesland === state).slice(0, 3)
  }, [experts, answers.bundesland])

  function choose(id: QuizQuestionId, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setStep((s) => s + 1)
  }

  if (!done) {
    const question = QUIZ_QUESTIONS[step]
    return (
      <div className="rounded-[22px] border border-border bg-surface p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-green-dk">
            {t.step} {step + 1} {t.of} {QUIZ_QUESTIONS.length}
          </p>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-sm font-medium text-ink-70 underline hover:text-brand-blue"
            >
              {backArrow(locale)} {t.back}
            </button>
          )}
        </div>

        {/* Progress is a meter, not decoration — announced to assistive tech. */}
        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-cream"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={QUIZ_QUESTIONS.length}
        >
          <div
            className="h-full rounded-full bg-brand-green transition-[width] duration-300"
            style={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
          />
        </div>

        <h2 className="mt-6 text-2xl font-bold leading-snug text-ink">{question.title[lang]}</h2>
        {question.hint && <p className="mt-2 text-sm text-ink-70">{question.hint[lang]}</p>}

        <div className="mt-6 flex flex-wrap gap-2.5">
          {question.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(question.id, option.value)}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                answers[question.id] === option.value
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-border bg-cream text-ink hover:border-brand-blue hover:text-brand-blue'
              }`}
            >
              {option.label[lang]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          className="mt-6 text-sm font-medium text-ink-50 underline hover:text-ink"
        >
          {t.skip}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[22px] border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-ink">{t.resultsTitle}</h2>
          <button
            type="button"
            onClick={() => {
              setAnswers({})
              setStep(0)
            }}
            className="text-sm font-medium text-ink-70 underline hover:text-brand-blue"
          >
            {t.restart}
          </button>
        </div>

        {ranked.length === 0 ? (
          <div className="mt-5">
            <p className="max-w-2xl text-ink-70">{t.resultsNone}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <SmartLink
                href={contactHref}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white hover:bg-brand-green-dk"
              >
                {t.contact} <span aria-hidden="true">{forwardArrow(locale)}</span>
              </SmartLink>
              <SmartLink
                href={allRoadmapsHref}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-ink hover:border-brand-blue hover:text-brand-blue"
              >
                {t.allRoadmaps}
              </SmartLink>
            </div>
          </div>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {ranked.map(({ item, score }) => (
              <li key={item.id}>
                <SmartLink
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-cream p-5 transition-colors hover:border-brand-blue"
                >
                  <span className="text-xs font-medium text-brand-green-dk">
                    {score > 1 ? t.matchMany : t.matchOne}
                  </span>
                  <span className="mt-2 text-lg font-bold text-ink group-hover:text-brand-blue">{item.title}</span>
                  {item.description && (
                    <span className="mt-1 line-clamp-2 text-sm text-ink-70">{item.description}</span>
                  )}
                  <span className="mt-4 text-sm font-semibold text-brand-blue">
                    {item.stepCount > 0 && `${item.stepCount} ${t.steps} · `}
                    {t.open} {forwardArrow(locale)}
                  </span>
                </SmartLink>
              </li>
            ))}
          </ul>
        )}
      </div>

      {nearbyExperts.length > 0 && (
        <div className="rounded-[22px] border border-border bg-surface p-6 md:p-8">
          <h2 className="text-xl font-bold text-ink">{t.expertsNearby}</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {nearbyExperts.map((expert) => (
              <li key={expert.id}>
                <SmartLink
                  href={expert.href}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-cream px-4 py-3 text-sm transition-colors hover:border-brand-blue"
                >
                  <span className="font-semibold text-ink">{expert.name}</span>
                  {expert.city && <span className="text-ink-50">{expert.city}</span>}
                </SmartLink>
              </li>
            ))}
          </ul>
          <SmartLink href={allExpertsHref} className="mt-4 inline-block text-sm font-semibold text-brand-blue">
            {t.allExperts} {forwardArrow(locale)}
          </SmartLink>
        </div>
      )}
    </div>
  )
}
