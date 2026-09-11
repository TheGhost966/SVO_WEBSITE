'use client'

import { useState } from 'react'
import { LexicalContent } from '@/components/ui/LexicalContent'
import type { FAQPayloadBlock } from '@/types/payload'

export function FAQBlock({ block }: { block: FAQPayloadBlock }) {
  const { heading, items = [] } = block
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-12 md:py-[var(--section-y-desktop)]">
      <div
        className="mx-auto max-w-[var(--max-w-content)] max-w-3xl"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-ink mb-8">{heading}</h2>
        )}
        <dl className="divide-y divide-border">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="py-4">
              <dt>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 text-start font-semibold text-ink hover:text-brand-blue transition-colors"
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                >
                  {item.question}
                  <span aria-hidden="true" className={`mt-0.5 text-xl leading-none transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
                </button>
              </dt>
              {open === i && (
                <dd className="mt-3 text-ink-70">
                  <LexicalContent content={item.answer} />
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
