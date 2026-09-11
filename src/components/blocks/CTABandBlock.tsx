import { ButtonLink } from '@/components/ui/Button'
import type { CTABandBlock as CTABandBlockType } from '@/types/payload'

const bgClasses: Record<string, string> = {
  green: 'bg-brand-green',
  navy:  'bg-brand-navy',
  blue:  'bg-brand-blue',
}

export function CTABandBlock({ block }: { block: CTABandBlockType }) {
  const { heading, subheading, primaryCta, secondaryCta, variant = 'green' } = block
  const bg = bgClasses[variant] ?? bgClasses['green']

  return (
    <section className={`py-16 md:py-20 ${bg}`}>
      <div
        className="mx-auto max-w-[var(--max-w-content)] text-center"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {heading && (
          <h2 className="text-2xl md:text-4xl font-bold text-white">{heading}</h2>
        )}
        {subheading && (
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl mx-auto">{subheading}</p>
        )}
        {(primaryCta?.label || secondaryCta?.label) && (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {primaryCta?.label && primaryCta?.url && (
              <ButtonLink
                href={primaryCta.url}
                variant={variant === 'green' ? 'secondary' : 'primary'}
                size="lg"
              >
                {primaryCta.label}
              </ButtonLink>
            )}
            {secondaryCta?.label && secondaryCta?.url && (
              <ButtonLink href={secondaryCta.url} variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-ink">
                {secondaryCta.label}
              </ButtonLink>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
