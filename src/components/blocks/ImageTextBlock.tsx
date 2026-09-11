import { MediaImage } from '@/components/ui/MediaImage'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { ButtonLink } from '@/components/ui/Button'
import type { ImageTextBlock as ImageTextBlockType } from '@/types/payload'

export function ImageTextBlock({ block }: { block: ImageTextBlockType }) {
  const { image, heading, body, imagePosition = 'start', cta } = block
  const imageFirst = imagePosition === 'start'

  return (
    <section className="py-12 md:py-[var(--section-y-desktop)]">
      <div
        className="mx-auto max-w-[var(--max-w-content)]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <div className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${!imageFirst ? 'md:[&>*:first-child]:order-last' : ''}`}>
          {/* Image */}
          {image && typeof image !== 'string' && (
            <div className="rounded-card-lg overflow-hidden">
              <MediaImage media={image} size="card" className="w-full" />
            </div>
          )}

          {/* Text */}
          <div>
            {heading && (
              <h2 className="text-2xl md:text-3xl font-bold text-ink mb-4">{heading}</h2>
            )}
            <LexicalContent content={body} />
            {cta?.label && cta?.url && (
              <div className="mt-6">
                <ButtonLink href={cta.url} variant="outline">{cta.label}</ButtonLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
