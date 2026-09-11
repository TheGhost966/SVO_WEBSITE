type Category = { id: string; name?: string | null; slug?: string | null }

type Props = {
  categories: Category[]
  currentSlug?: string
  allLabel: string
  basePath: string
  /** Additional query params appended to every link (e.g. { view: 'past' }) */
  extraParams?: Record<string, string>
}

function buildUrl(basePath: string, catSlug?: string, extra?: Record<string, string>): string {
  const sp = new URLSearchParams(extra)
  if (catSlug) sp.set('cat', catSlug)
  const qs = sp.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function CategoryFilter({ categories, currentSlug, allLabel, basePath, extraParams }: Props) {
  return (
    <nav aria-label={allLabel} className="mb-8">
      <ul className="flex flex-wrap gap-2" role="list">
        {/* "All" tab */}
        <li>
          <a
            href={buildUrl(basePath, undefined, extraParams)}
            className={`inline-block px-4 py-2 rounded-control text-sm font-medium transition-colors ${
              !currentSlug
                ? 'bg-brand-blue text-white'
                : 'bg-cream text-ink-70 border border-border hover:border-brand-blue hover:text-brand-blue'
            }`}
            aria-current={!currentSlug ? 'true' : undefined}
          >
            {allLabel}
          </a>
        </li>

        {categories.map((cat) => {
          const active = currentSlug === cat.slug
          return (
            <li key={cat.id}>
              <a
                href={buildUrl(basePath, cat.slug ?? undefined, extraParams)}
                className={`inline-block px-4 py-2 rounded-control text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-blue text-white'
                    : 'bg-cream text-ink-70 border border-border hover:border-brand-blue hover:text-brand-blue'
                }`}
                aria-current={active ? 'true' : undefined}
              >
                {cat.name}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
