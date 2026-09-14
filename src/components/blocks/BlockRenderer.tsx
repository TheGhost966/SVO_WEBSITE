import type { PageBlock } from '@/types/payload'
import { HeroBlock } from './HeroBlock'
import { RichTextBlock } from './RichTextBlock'
import { ImageTextBlock } from './ImageTextBlock'
import { CardGridBlock } from './CardGridBlock'
import { StatsBlock } from './StatsBlock'
import { CTABandBlock } from './CTABandBlock'
import { FAQBlock } from './FAQBlock'
import { LogoGridBlock } from './LogoGridBlock'
import { TimelineBlock } from './TimelineBlock'
import { ContactBlockBlock } from './ContactBlockBlock'

type Props = {
  blocks: PageBlock[]
  locale: string
}

export function BlockRenderer({ blocks, locale }: Props) {
  return (
    <>
      {blocks.map((block, i) => {
        const key = block.id ?? `block-${i}`

        switch (block.blockType) {
          case 'hero':
            return <HeroBlock key={key} block={block} />
          case 'rich-text':
            return <RichTextBlock key={key} block={block} />
          case 'image-text':
            return <ImageTextBlock key={key} block={block} />
          case 'card-grid':
            return <CardGridBlock key={key} block={block} locale={locale} />
          case 'stats':
            return <StatsBlock key={key} block={block} />
          case 'cta-band':
            return <CTABandBlock key={key} block={block} />
          case 'faq':
            return <FAQBlock key={key} block={block} />
          case 'logo-grid':
            return <LogoGridBlock key={key} block={block} />
          case 'timeline':
            return <TimelineBlock key={key} block={block} />
          case 'contact-block':
            return <ContactBlockBlock key={key} block={block} locale={locale} />
          default:
            return null
        }
      })}
    </>
  )
}
