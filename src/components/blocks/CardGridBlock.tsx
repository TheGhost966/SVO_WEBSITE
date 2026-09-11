import { MediaImage } from '@/components/ui/MediaImage'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { CardGridBlock as CardGridBlockType, ResolvedMedia } from '@/types/payload'

const colClasses: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export function CardGridBlock({ block }: { block: CardGridBlockType }) {
  const { heading, subheading, cards = [], columns = '3' } = block

  return (
    <section className="py-12 md:py-[var(--section-y-desktop)]">
      <div
        className="mx-auto max-w-[var(--max-w-content)]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {(heading || subheading) && (
          <SectionHeader title={heading ?? ''} subtitle={subheading ?? undefined} />
        )}

        <div className={`grid ${colClasses[columns] ?? colClasses['3']} gap-6`}>
          {cards.map((card, i) => (
            <div
              key={card.id ?? i}
              className="bg-surface rounded-card border border-border p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              {/* Icon or image */}
              {card.image && typeof card.image !== 'string' ? (
                <div className="rounded-card overflow-hidden aspect-[4/3]">
                  <MediaImage media={card.image as ResolvedMedia} size="card" className="w-full h-full object-cover" />
                </div>
              ) : card.icon ? (
                <span className="text-3xl" aria-hidden="true">{card.icon}</span>
              ) : null}

              {card.heading && (
                <h3 className="font-semibold text-ink text-base">{card.heading}</h3>
              )}
              {card.body && (
                <p className="text-sm text-ink-70 flex-1">{card.body}</p>
              )}
              {card.url && card.linkLabel && (
                <a
                  href={card.url}
                  className="text-sm font-semibold text-brand-blue hover:text-brand-navy transition-colors"
                >
                  {card.linkLabel} →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
