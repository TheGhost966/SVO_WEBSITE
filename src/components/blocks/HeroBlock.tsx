import { MediaImage } from '@/components/ui/MediaImage'
import { ButtonLink } from '@/components/ui/Button'
import type { HeroBlock as HeroBlockType } from '@/types/payload'

export function HeroBlock({ block }: { block: HeroBlockType }) {
  const { heading, subheading, body, image, cta, variant = 'default' } = block

  const isImageVariant = variant === 'image' && image
  const isCompact = variant === 'compact'

  return (
    <section
      className={`relative overflow-hidden ${
        isImageVariant ? 'min-h-[70vh]' : isCompact ? 'py-16' : 'py-20 md:py-[84px]'
      } ${isImageVariant ? '' : 'bg-brand-navy'}`}
      aria-label={heading ?? undefined}
    >
      {/* Background image */}
      {isImageVariant && typeof image !== 'string' && (
        <>
          <MediaImage media={image} size="hero" fill priority className="z-0" />
          <div className="absolute inset-0 bg-brand-navy/60 z-10" aria-hidden="true" />
        </>
      )}

      <div
        className="relative z-20 mx-auto max-w-[var(--max-w-content)] flex flex-col justify-center min-h-full"
        style={{ paddingInlineStart: 'clamp(24px, 8vw, 120px)', paddingInlineEnd: 'clamp(24px, 8vw, 120px)' }}
      >
        <div className="max-w-2xl">
          {heading && (
            <h1 className={`font-bold leading-tight text-white ${isCompact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'}`}>
              {heading}
            </h1>
          )}
          {subheading && (
            <p className="mt-4 text-lg md:text-xl text-white/80 font-medium">{subheading}</p>
          )}
          {body && (
            <p className="mt-4 text-base text-white/70 leading-relaxed">{body}</p>
          )}
          {cta?.label && cta?.url && (
            <div className="mt-8">
              <ButtonLink href={cta.url} variant="primary" size="lg">
                {cta.label}
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
