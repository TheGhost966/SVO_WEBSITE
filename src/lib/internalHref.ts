import { getPathname } from '@/i18n/navigation'

/**
 * Resolves a CMS-authored internal path to the correct locale-specific URL.
 *
 * `SiteSettings.homeGroup`'s href fields (heroCtaHref, ctaBandCtaHref, helpCards[].href) are
 * deliberately unlocalized plain text (one value, not per-locale copy), which only works site-wide because AR and EN already
 * share the same English-language route segments — DE alone has different
 * segments (`/contact` → `/kontakt`, `/services` → `/leistungen`, etc., per
 * `src/i18n/routing.ts`'s `pathnames`). A raw `<a href={value}>` (the pattern `CardGridBlock`
 * already uses for its own CMS url field) would 404 on DE for exactly those routes. Board editors
 * enter the canonical English-style key (e.g. `/contact`, matching a `pathnames` key), and this
 * resolves it through the same routing table `Link`/`getPathname` already use, so the one stored
 * value is correct on all three locales.
 *
 * Falls back to the raw value unchanged for anything that isn't a recognized canonical key —
 * external URLs (`https://...`), `mailto:`/`tel:` links, or a path an editor already typed as the
 * literal locale-correct segment.
 */
export function resolveInternalHref(href: string | null | undefined, locale: string): string {
  if (!href) return '#'
  if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
    return href
  }
  const [pathname, query] = href.split('?')
  try {
    // CMS-authored strings are dynamic and can't be checked against next-intl's literal
    // pathname-key union at compile time — this boundary intentionally trusts the stored value
    // and falls back to it unchanged (via the catch) when it isn't a recognized key.
    const resolved = getPathname({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href: pathname as any,
      locale: locale as 'de' | 'ar' | 'en',
    })
    return query ? `${resolved}?${query}` : resolved
  } catch {
    return href
  }
}
