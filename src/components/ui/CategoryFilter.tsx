type Category = { id: string; name?: string | null; slug?: string | null }

type Props = {
  categories: Category[]
  currentSlug?: string
  allLabel: string
  basePath: string
}

export function CategoryFilter({ categories, currentSlug, allLabel, basePath }: Props) {
  return (
    <nav aria-label={allLabel} className="mb-8">
      <ul className="flex flex-wrap gap-2" role="list">
        {/* "All" tab */}
        <li>
          <a
            href={basePath}
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
                href={cat.slug ? `${basePath}?cat=${cat.slug}` : basePath}
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
