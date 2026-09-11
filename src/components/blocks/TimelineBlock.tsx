import type { TimelineBlock as TimelineBlockType } from '@/types/payload'

export function TimelineBlock({ block }: { block: TimelineBlockType }) {
  const { heading, items = [] } = block

  return (
    <section className="py-12 md:py-[var(--section-y-desktop)]">
      <div
        className="mx-auto max-w-[var(--max-w-content)] max-w-3xl"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-10">{heading}</h2>
        )}
        <ol className="relative border-s border-brand-blue/20" role="list">
          {items.map((item, i) => (
            <li key={item.id ?? i} className="mb-10 ms-6">
              <span
                className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue ring-4 ring-white text-white text-xs font-bold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <time className="text-xs font-semibold text-brand-blue uppercase tracking-wider">
                {item.year}
              </time>
              <h3 className="mt-1 font-semibold text-ink">{item.title}</h3>
              {item.description && (
                <p className="mt-1 text-sm text-ink-70">{item.description}</p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
