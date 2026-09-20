import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { forwardArrow } from '@/i18n/routing'

/** Shared section container — 1200px content width, 120px desktop gutters, per the Figma frames. */
export function HomeSectionShell({
  id,
  bg = 'bg-surface',
  children,
}: {
  id: string
  bg?: string
  children: ReactNode
}) {
  return (
    <section className={`py-16 md:py-[96px] ${bg}`} aria-labelledby={id}>
      <div
        className="mx-auto max-w-[1200px]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {children}
      </div>
    </section>
  )
}

/**
 * Figma section head: green eyebrow with a trailing rule, large bold title, muted subtitle, and an
 * outlined "view all" button on the opposite (end) side. `dark` flips colours for the navy experts band.
 * The button is a real link to the section's index page — never a dead control.
 */
export function SectionHead({
  id,
  eyebrow,
  title,
  subtitle,
  action,
  locale,
  dark = false,
}: {
  id: string
  eyebrow?: string
  title: string
  subtitle?: string
  action?: { href: Parameters<typeof Link>[0]['href']; label: string }
  locale: string
  dark?: boolean
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12">
      <div className="max-w-3xl">
        {eyebrow && (
          <div
            className={`flex items-center gap-3 mb-4 text-xs font-semibold tracking-[0.08em] ${
              dark ? 'text-brand-green' : 'text-brand-green-dk'
            }`}
          >
            <span>{eyebrow}</span>
            <span className={`h-px w-7 ${dark ? 'bg-brand-green' : 'bg-brand-green'}`} aria-hidden="true" />
          </div>
        )}
        <h2
          id={id}
          className={`text-3xl md:text-[40px] font-bold leading-[1.2] text-balance ${dark ? 'text-white' : 'text-ink'}`}
        >
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-4 text-base md:text-lg leading-relaxed ${dark ? 'text-white/75' : 'text-ink-70'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={`shrink-0 inline-flex items-center gap-2 self-start md:self-auto rounded-control border px-5 py-3 text-sm font-medium transition-colors ${
            dark
              ? 'border-white/30 text-white hover:bg-white/10'
              : 'border-border bg-surface text-brand-blue hover:border-brand-blue'
          }`}
        >
          {action.label}
          <span aria-hidden="true">{forwardArrow(locale)}</span>
        </Link>
      )}
    </div>
  )
}
