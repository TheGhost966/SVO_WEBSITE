import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { forwardArrow } from '@/i18n/routing'

/** Shared section container — matches the spacing/max-width already used across the homepage. */
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
    <section className={`py-12 md:py-[84px] ${bg}`} aria-labelledby={id}>
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
 * The trailing grid cell for a teaser row — always a real link to the section's own index page,
 * never a dead end. Keeps a thin row (1–2 real items) from reading as broken by giving the grid a
 * deliberate final cell instead of an oddly short row.
 */
export function ViewAllCard({
  href,
  label,
  locale,
}: {
  href: Parameters<typeof Link>[0]['href']
  label: string
  locale: string
}) {
  return (
    <Link
      href={href}
      className="group bg-cream rounded-card border border-dashed border-border p-6 flex flex-col items-center justify-center text-center gap-2 hover:border-brand-blue hover:bg-surface transition-all min-h-[140px]"
    >
      <span className="font-semibold text-brand-blue group-hover:text-brand-navy">
        {label}
      </span>
      <span className="text-brand-blue text-lg" aria-hidden="true">
        {forwardArrow(locale)}
      </span>
    </Link>
  )
}
