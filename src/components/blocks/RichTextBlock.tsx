import { LexicalContent } from '@/components/ui/LexicalContent'
import type { RichTextPayloadBlock } from '@/types/payload'

export function RichTextBlock({ block }: { block: RichTextPayloadBlock }) {
  return (
    <section className="py-12 md:py-16">
      <div
        className={`mx-auto max-w-[var(--max-w-content)] ${block.width === 'wide' ? '' : 'max-w-3xl'}`}
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <LexicalContent content={block.content} />
      </div>
    </section>
  )
}
