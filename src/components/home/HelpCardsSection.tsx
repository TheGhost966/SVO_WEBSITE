import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon } from '@/components/ui/Icon'
import { resolveInternalHref } from '@/lib/internalHref'
import type { SiteSettingsDoc } from '@/types/payload'
import { HomeSectionShell } from './shared'

// Reuses real, already-shipped nav/page titles — not invented marketing copy, so no
// placeholder marker is needed (Working Agreement #3 only requires that for authored copy).
const DEFAULT_CARDS: Record<string, Array<{ title: string; href: string; icon: string }>> = {
  de: [
    { title: 'Österreich-Guide', href: '/guide', icon: 'book-open' },
    { title: 'Unsere Leistungen', href: '/services', icon: 'scale' },
    { title: 'Kontakt aufnehmen', href: '/contact', icon: 'mail' },
  ],
  ar: [
    { title: 'دليل النمسا', href: '/guide', icon: 'book-open' },
    { title: 'خدماتنا', href: '/services', icon: 'scale' },
    { title: 'تواصل معنا', href: '/contact', icon: 'mail' },
  ],
  en: [
    { title: 'Austria Guide', href: '/guide', icon: 'book-open' },
    { title: 'Our services', href: '/services', icon: 'scale' },
    { title: 'Get in touch', href: '/contact', icon: 'mail' },
  ],
}

export function HelpCardsSection({
  locale,
  siteSettings,
  t,
}: {
  locale: string
  siteSettings: SiteSettingsDoc | null
  t: (key: string) => string
}) {
  const cmsCards = siteSettings?.homeGroup?.helpCards ?? []
  const cards =
    cmsCards.length > 0
      ? cmsCards.map((c) => ({ title: c.title, description: c.description, href: resolveInternalHref(c.href, locale), icon: null as string | null }))
      : (DEFAULT_CARDS[locale] ?? DEFAULT_CARDS.de).map((c) => ({ ...c, description: null as string | null, href: resolveInternalHref(c.href, locale) }))

  return (
    <HomeSectionShell id="help-cards-heading" bg="bg-cream">
      <SectionHeader id="help-cards-heading" title={t('helpCardsHeading')} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          // Plain <a>, not next-intl's typed Link: `card.href` is a runtime string already
          // resolved by resolveInternalHref (CMS data or a locale-correct default), which can't
          // be checked against Link's literal pathname-key union at compile time — same pattern
          // CardGridBlock already uses for its own CMS url field.
          <a
            key={i}
            href={card.href}
            className="group bg-surface rounded-card border border-border p-6 flex flex-col gap-3 hover:border-brand-blue hover:shadow-md transition-all"
          >
            {card.icon && (
              <span
                className="w-12 h-12 rounded-card flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-brand-green-lt)', color: 'var(--color-brand-green-dk)' }}
              >
                <Icon name={card.icon} className="w-6 h-6" />
              </span>
            )}
            <h3 className="font-semibold text-ink group-hover:text-brand-blue transition-colors">{card.title}</h3>
            {card.description && <p className="text-sm text-ink-70 line-clamp-3">{card.description}</p>}
          </a>
        ))}
      </div>
    </HomeSectionShell>
  )
}
