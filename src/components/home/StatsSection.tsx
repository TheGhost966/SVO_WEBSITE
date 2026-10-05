import type { SiteSettingsDoc } from '@/types/payload'
import type { HomeStatSource } from '@/lib/queries'

/**
 * A numeric tile only renders when its count is ≥ 3 (a computed
 * "1 Expert:in" is worse than no number at all). If fewer than three CMS-configured tiles
 * survive that filter — including when `statLabels` is empty outright — fall back to the
 * static, non-count trust signals §2.5 names as always-safe (9 Bundesländer, 3 Sprachen,
 * 4 Schwerpunkte). The band never fully disappears: an empty stats band reads as a broken
 * page, not a thin one.
 *
 * Figma look (2.png): white strip, large blue numerals over a muted label, hairline below.
 * The Figma's "+1,200 members" / "+250 experts" figures are not reproduced — nothing backs them.
 */
const STATIC_FALLBACK: Record<string, Array<{ value: string; label: string }>> = {
  de: [
    { value: '9', label: 'Bundesländer' },
    { value: '3', label: 'Sprachen' },
    { value: '4', label: 'Schwerpunkte' },
  ],
  ar: [
    { value: '9', label: 'ولايات نمساوية' },
    { value: '3', label: 'لغات' },
    { value: '4', label: 'مجالات رئيسية' },
  ],
  en: [
    { value: '9', label: 'Austrian states' },
    { value: '3', label: 'Languages' },
    { value: '4', label: 'Focus areas' },
  ],
}

export function StatsSection({
  locale,
  siteSettings,
  statCounts,
  t,
}: {
  locale: string
  siteSettings: SiteSettingsDoc | null
  statCounts: Record<HomeStatSource, number>
  t: (key: string) => string
}) {
  const configured = siteSettings?.homeGroup?.statLabels ?? []
  const dynamicTiles = configured
    .map((row) => ({ value: statCounts[row.source], label: row.label }))
    .filter((tile) => tile.label && tile.value >= 3)

  const tiles = dynamicTiles.length >= 3 ? dynamicTiles : (STATIC_FALLBACK[locale] ?? STATIC_FALLBACK.de)

  return (
    <section className="bg-surface" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">
        {t('statsHeading')}
      </h2>
      <div
        className="mx-auto max-w-[1200px] grid gap-8 py-10 md:py-12 grid-cols-2 md:grid-flow-col md:auto-cols-fr"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {tiles.map((tile, i) => (
          <div key={i} className="text-start">
            <div className="text-4xl md:text-5xl font-bold text-brand-blue leading-none">{tile.value}</div>
            <div className="mt-2 text-sm md:text-base text-ink-70">{tile.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
