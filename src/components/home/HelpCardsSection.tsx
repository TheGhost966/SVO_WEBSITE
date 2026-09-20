import { Icon } from '@/components/ui/Icon'
import { resolveInternalHref } from '@/lib/internalHref'
import type { SiteSettingsDoc } from '@/types/payload'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'

/**
 * Figma 2.png: four cards on cream, the first one dark navy ("I don't know where to start").
 * Board-authored `homeGroup.helpCards` still win; the first CMS card takes the dark treatment so
 * the layout matches whichever source supplies the cards. Copy is placeholder pending sign-off.
 * The Figma's per-card count tags ("+40 articles", "reply within 48 h") are omitted — not real.
 */
export function HelpCardsSection({
  locale,
  siteSettings,
  t,
}: {
  locale: string
  siteSettings: SiteSettingsDoc | null
  t: (key: string) => string
}) {
  const copy = homeCopy(locale)
  const cmsCards = siteSettings?.homeGroup?.helpCards ?? []
  const cards =
    cmsCards.length > 0
      ? cmsCards.map((c, i) => ({
          title: c.title,
          description: c.description ?? null,
          href: resolveInternalHref(c.href, locale),
          icon: (['compass', 'help-circle', 'users', 'book-open'] as const)[i % 4],
          dark: i === 0,
        }))
      : copy.helpCards.map((c) => ({ ...c, href: resolveInternalHref(c.href, locale) }))

  return (
    <HomeSectionShell id="help-cards-heading" bg="bg-cream">
      <SectionHead
        id="help-cards-heading"
        eyebrow={copy.eyebrow.help}
        title={t('helpCardsHeading')}
        subtitle={copy.helpSubtitle}
        locale={locale}
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          // Plain <a>: `card.href` is a runtime string already resolved by resolveInternalHref
          // (CMS data or a locale-correct default), which can't be checked against next-intl's
          // typed Link union at compile time — same pattern CardGridBlock uses.
          <a
            key={i}
            href={card.href}
            className={`group flex flex-col gap-4 rounded-[18px] border p-7 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              card.dark ? 'border-brand-navy bg-brand-navy text-white' : 'border-border bg-surface text-ink'
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                card.dark ? 'bg-white/10 text-brand-green' : 'bg-brand-green-lt text-brand-green-dk'
              }`}
            >
              <Icon name={card.icon} className="h-6 w-6" />
            </span>
            <h3 className="text-xl font-bold leading-snug">{card.title}</h3>
            {card.description && (
              <p className={`text-sm leading-relaxed ${card.dark ? 'text-white/70' : 'text-ink-70'}`}>
                {card.description}
              </p>
            )}
          </a>
        ))}
      </div>
    </HomeSectionShell>
  )
}
