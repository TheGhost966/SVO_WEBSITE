import { backArrow, forwardArrow } from '@/i18n/routing'

type Props = {
  page: number
  hasNextPage: boolean
  totalPages?: number
  makeUrl: (p: number) => string
  locale: string
}

const labels = {
  de: { prev: 'Vorherige', next: 'Nächste', page: 'Seite' },
  ar: { prev: 'السابق', next: 'التالي', page: 'صفحة' },
  en: { prev: 'Previous', next: 'Next', page: 'Page' },
}

export function Pagination({ page, hasNextPage, totalPages, makeUrl, locale }: Props) {
  const l = labels[locale as keyof typeof labels] ?? labels.de
  // "Previous" moves back against the reading direction, "next" moves with it —
  // in Arabic that's the reverse of German/English, not the same glyphs.
  const prevArrow = backArrow(locale)
  const nextArrow = forwardArrow(locale)

  if (page <= 1 && !hasNextPage) return null

  return (
    <nav
      aria-label={l.page}
      className="flex items-center justify-between mt-12 pt-6 border-t border-border"
    >
      {/* Prev */}
      {page > 1 ? (
        <a
          href={makeUrl(page - 1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control border border-border text-sm font-medium text-ink-70 hover:border-brand-blue hover:text-brand-blue transition-colors"
        >
          {prevArrow} {l.prev}
        </a>
      ) : (
        <span />
      )}

      {/* Page indicator */}
      <span className="text-sm text-ink-50">
        {l.page} {page}{totalPages ? ` / ${totalPages}` : ''}
      </span>

      {/* Next */}
      {hasNextPage ? (
        <a
          href={makeUrl(page + 1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-control border border-border text-sm font-medium text-ink-70 hover:border-brand-blue hover:text-brand-blue transition-colors"
        >
          {l.next} {nextArrow}
        </a>
      ) : (
        <span />
      )}
    </nav>
  )
}
