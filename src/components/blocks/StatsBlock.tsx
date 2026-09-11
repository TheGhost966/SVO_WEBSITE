import type { StatsBlock as StatsBlockType } from '@/types/payload'

const bgClasses: Record<string, string> = {
  light: 'bg-cream',
  dark:  'bg-brand-navy text-white',
  green: 'bg-brand-green-lt',
}

export function StatsBlock({ block }: { block: StatsBlockType }) {
  const { heading, stats = [], variant = 'light' } = block

  return (
    <section className={`py-12 md:py-[var(--section-y-desktop)] ${bgClasses[variant] ?? bgClasses['light']}`}>
      <div
        className="mx-auto max-w-[var(--max-w-content)]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {heading && (
          <h2 className={`text-2xl md:text-3xl font-bold mb-10 text-center ${variant === 'dark' ? 'text-white' : 'text-ink'}`}>
            {heading}
          </h2>
        )}
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {stats.map((s, i) => (
            <div key={s.id ?? i} className="text-center">
              <dt className={`text-4xl md:text-5xl font-bold ${variant === 'dark' ? 'text-brand-green' : 'text-brand-blue'}`}>
                {s.value}
              </dt>
              <dd className={`mt-2 text-sm font-medium ${variant === 'dark' ? 'text-white/80' : 'text-ink'}`}>
                {s.label}
              </dd>
              {s.description && (
                <p className={`mt-1 text-xs ${variant === 'dark' ? 'text-white/50' : 'text-ink-50'}`}>
                  {s.description}
                </p>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
