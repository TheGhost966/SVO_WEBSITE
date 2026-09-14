import { defineRouting } from 'next-intl/routing'

export const locales = ['de', 'ar', 'en'] as const
export type Locale = (typeof locales)[number]

export function isRtlLocale(locale: string): boolean {
  return locale === 'ar'
}

/**
 * A "forward" glyph (continue reading, next page) points the way the reading
 * direction actually advances — right in de/en, left in ar. A hardcoded "→"
 * points the wrong way for Arabic.
 */
export function forwardArrow(locale: string): '→' | '←' {
  return isRtlLocale(locale) ? '←' : '→'
}

export function backArrow(locale: string): '→' | '←' {
  return isRtlLocale(locale) ? '→' : '←'
}

export const routing = defineRouting({
  locales,
  defaultLocale: 'de',
  // Locale prefix on all three — /de /ar /en
  localePrefix: 'always',
  // Locale-specific path names (German gets German words; AR/EN use English words)
  pathnames: {
    '/': '/',
    '/about': {
      de: '/ueber-uns',
      ar: '/about',
      en: '/about',
    },
    '/news': {
      de: '/nachrichten',
      ar: '/news',
      en: '/news',
    },
    '/news/[slug]': {
      de: '/nachrichten/[slug]',
      ar: '/news/[slug]',
      en: '/news/[slug]',
    },
    '/events': {
      de: '/veranstaltungen',
      ar: '/events',
      en: '/events',
    },
    '/events/[slug]': {
      de: '/veranstaltungen/[slug]',
      ar: '/events/[slug]',
      en: '/events/[slug]',
    },
    '/services': {
      de: '/leistungen',
      ar: '/services',
      en: '/services',
    },
    '/services/[pillar]': {
      de: '/leistungen/[pillar]',
      ar: '/services/[pillar]',
      en: '/services/[pillar]',
    },
    '/services/[pillar]/[service]': {
      de: '/leistungen/[pillar]/[service]',
      ar: '/services/[pillar]/[service]',
      en: '/services/[pillar]/[service]',
    },
    '/guide': {
      de: '/oesterreich-guide',
      ar: '/guide',
      en: '/guide',
    },
    '/guide/[topic]': {
      de: '/oesterreich-guide/[topic]',
      ar: '/guide/[topic]',
      en: '/guide/[topic]',
    },
    '/guide/[topic]/[article]': {
      de: '/oesterreich-guide/[topic]/[article]',
      ar: '/guide/[topic]/[article]',
      en: '/guide/[topic]/[article]',
    },
    '/contact': {
      de: '/kontakt',
      ar: '/contact',
      en: '/contact',
    },
    '/partners': {
      de: '/partner',
      ar: '/partners',
      en: '/partners',
    },
    '/impressum': '/impressum',
    '/datenschutz': {
      de: '/datenschutz',
      ar: '/datenschutz',
      en: '/privacy-policy',
    },
    '/barrierefreiheit': {
      de: '/barrierefreiheit',
      ar: '/barrierefreiheit',
      en: '/accessibility',
    },
  },
})
