import { MediaImage } from '@/components/ui/MediaImage'
import type { LogoGridBlock as LogoGridBlockType, ResolvedMedia } from '@/types/payload'

export function LogoGridBlock({ block }: { block: LogoGridBlockType }) {
  const { heading, logos = [] } = block

  return (
    <section className="py-12 md:py-16 bg-cream">
      <div
        className="mx-auto max-w-[var(--max-w-content)]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {heading && (
          <h2 className="text-center text-sm font-semibold text-ink-50 uppercase tracking-widest mb-8">
            {heading}
          </h2>
        )}
        <ul className="flex flex-wrap items-center justify-center gap-8 md:gap-12" role="list">
          {logos.map((logo, i) => (
            <li key={logo.id ?? i}>
              {logo.url ? (
                <a href={logo.url} target="_blank" rel="noopener noreferrer" aria-label={logo.name ?? undefined}>
                  <MediaImage
                    media={logo.image as ResolvedMedia}
                    size="thumbnail"
                    className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
                    alt={logo.name ?? ''}
                  />
                </a>
              ) : (
                <MediaImage
                  media={logo.image as ResolvedMedia}
                  size="thumbnail"
                  className="h-10 w-auto object-contain grayscale"
                  alt={logo.name ?? ''}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
