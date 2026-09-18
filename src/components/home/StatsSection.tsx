import { HomeSectionShell } from './shared'
import type { SiteSettingsDoc } from '@/types/payload'
import type { HomeStatSource } from '@/lib/queries'

/**
 * BRIEF-AMENDMENT-02 §2.5: a numeric tile only renders when its count is ≥ 3 (a computed
 * "1 Expert:in" is worse than no number at all). If fewer than three CMS-configured tiles
 * survive that filter — including when `statLabels` is empty outright — fall back to the
 * static, non-count trust signals §2.5 names as always-safe (9 Bundesländer, 3 Sprachen,
 * 4 Schwerpunkte). The band never fully disappears: an empty stats band reads as a broken
 * page, not a thin one.
 */
const STATIC_FALLBACK: Record<string, Array<{ value: string; label: string }>> = {
  de: [
    { value: '9', label: 'Bundesländer' },
    { value: '3', label: 'Sprachen' },
    { value: '4', label: 'Schwerpunkte' },
  ],
  ar: [
    { value: '9', label: 'محافظات نمساوية' },
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
    .filter((tile) => tile.value >= 3)

  const tiles = dynamicTiles.length >= 3 ? dynamicTiles : (STATIC_FALLBACK[locale] ?? STATIC_FALLBACK.de)

  return (
    <HomeSectionShell id="stats-heading" bg="bg-brand-green-lt">
      <h2 id="stats-heading" className="sr-only">
        {t('statsHeading')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
        {tiles.map((tile, i) => (
          <div key={i}>
            <div className="text-3xl md:text-4xl font-bold text-brand-green-dk">{tile.value}</div>
            <div className="mt-1 text-sm md:text-base text-ink-70 font-medium">{tile.label}</div>
          </div>
        ))}
      </div>
    </HomeSectionShell>
  )
}
