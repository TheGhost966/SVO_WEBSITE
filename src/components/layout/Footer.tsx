import { getTranslations } from 'next-intl/server'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getSiteSettings } from '@/lib/queries'

/**
 * Figma 11.png: navy footer — brand block with icon buttons, four link columns, the nine-Bundesland
 * pill row, and a legal bar. Links are only ones that lead somewhere real (AMENDMENT-02 §2.4):
 * the Figma's "Digital membership", "Annual reports", "Volunteering hours", "Terms" and
 * "Voice of the community" entries have no destination and are not rendered. Contact details come
 * from `SiteSettings.contactGroup` (not the Figma's sample email/phone) and are omitted until set.
 */
const COPY: Record<
  string,
  { community: string; services: string; association: string; contact: string; contactForm: string; regions: string; tagline: string }
> = {
  de: {
    community: 'Community',
    services: 'Angebote',
    association: 'Verband',
    contact: 'Kontakt',
    contactForm: 'Kontaktformular',
    regions: 'Aktiv in allen neun Bundesländern',
    tagline: 'Bauen · Verbinden · Umsetzen — Orientierung und Vernetzung für die syrische Community in Österreich.',
  },
  ar: {
    community: 'المجتمع',
    services: 'الخدمات',
    association: 'الاتحاد',
    contact: 'تواصل معنا',
    contactForm: 'نموذج التواصل',
    regions: 'محتوى ودعم في كل الولايات النمساوية التسع',
    tagline: 'نبني · نربط · ننفذ — إرشاد وربط وخدمات للجالية السورية في النمسا.',
  },
  en: {
    community: 'Community',
    services: 'Services',
    association: 'Association',
    contact: 'Contact',
    contactForm: 'Contact form',
    regions: 'Active in all nine Austrian states',
    tagline: 'Building · Connecting · Delivering — orientation and networking for the Syrian community in Austria.',
  },
}

const BUNDESLAENDER = [
  'Wien',
  'Niederösterreich',
  'Oberösterreich',
  'Salzburg',
  'Tirol',
  'Vorarlberg',
  'Steiermark',
  'Kärnten',
  'Burgenland',
]

export async function Footer({ locale }: { locale: string }) {
  const [t, tLegal, tNav, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'footer' }),
    getTranslations({ locale, namespace: 'legal' }),
    getTranslations({ locale, namespace: 'nav' }),
    getSiteSettings(locale),
  ])
  const copy = COPY[locale] ?? COPY.de
  const contact = settings?.contactGroup
  const currentYear = new Date().getFullYear()

  const legalLinks = [
    { href: '/impressum' as const, label: tLegal('impressum') },
    { href: '/datenschutz' as const, label: tLegal('datenschutz') },
    { href: '/barrierefreiheit' as const, label: tLegal('barrierefreiheit') },
  ]

  const linkClass = 'text-sm text-white/70 transition-colors hover:text-white'
  const headClass = 'mb-5 text-base font-bold text-white'

  return (
    <footer className="bg-brand-navy text-white" aria-label="Footer">
      <div
        className="mx-auto max-w-[var(--max-w-content)] px-6 py-14"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand */}
          <div className="max-w-sm">
            <p className="text-[28px] font-bold leading-none tracking-tight">SVÖ</p>
            <p className="mt-1 text-[11px] font-medium text-brand-green">
              {locale === 'ar' ? 'الاتحاد السوري في النمسا' : locale === 'en' ? 'Syrian Association in Austria' : 'Syrischer Verband in Österreich'}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-white/65">{copy.tagline}</p>
            <div className="mt-6 flex gap-3">
              {contact?.address && (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10" title={contact.address}>
                  <MapPin className="h-4 w-4" aria-label={contact.address} />
                </span>
              )}
              {contact?.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
                  aria-label={contact.phone}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {contact?.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20"
                  aria-label={contact.email}
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* prefetch={false} throughout: the footer carries ~15 links and repeats on every page,
              so viewport prefetching fired a request per link for every visitor who scrolled to
              the bottom, whether or not they meant to go anywhere. Next.js still prefetches on
              hover/touch-start, which is what actually precedes a click — the navigation stays
              instant, the speculative traffic goes away. */}
          <nav aria-label={copy.community}>
            <h2 className={headClass}>{copy.community}</h2>
            <ul className="flex flex-col gap-3">
              <li><Link href="/jobs" prefetch={false} className={linkClass}>{tNav('jobs')}</Link></li>
              <li><Link href="/events" prefetch={false} className={linkClass}>{tNav('events')}</Link></li>
              <li>
                <Link href={{ pathname: '/contact', query: { category: 'volunteering' } }} prefetch={false} className={linkClass}>
                  {t('volunteer')}
                </Link>
              </li>
              <li>
                <Link href={{ pathname: '/contact', query: { category: 'idea' } }} prefetch={false} className={linkClass}>
                  {t('idea')}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={copy.services}>
            <h2 className={headClass}>{copy.services}</h2>
            <ul className="flex flex-col gap-3">
              <li><Link href="/guide" prefetch={false} className={linkClass}>{tNav('guide')}</Link></li>
              <li><Link href="/roadmaps" prefetch={false} className={linkClass}>{tNav('roadmaps')}</Link></li>
              <li><Link href="/experts" prefetch={false} className={linkClass}>{tNav('experts')}</Link></li>
              <li><Link href="/services" prefetch={false} className={linkClass}>{tNav('services')}</Link></li>
            </ul>
          </nav>

          <nav aria-label={copy.association}>
            <h2 className={headClass}>{copy.association}</h2>
            <ul className="flex flex-col gap-3">
              <li><Link href="/about" prefetch={false} className={linkClass}>{tNav('about')}</Link></li>
              <li><Link href="/news" prefetch={false} className={linkClass}>{tNav('news')}</Link></li>
              <li><Link href="/partners" prefetch={false} className={linkClass}>{tNav('partners')}</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className={headClass}>{copy.contact}</h2>
            <ul className="flex flex-col gap-3 text-sm text-white/70">
              {contact?.email && (
                <li><a href={`mailto:${contact.email}`} className="transition-colors hover:text-white">{contact.email}</a></li>
              )}
              {contact?.phone && <li dir="ltr" className="text-start">{contact.phone}</li>}
              {contact?.address && <li className="whitespace-pre-line">{contact.address}</li>}
              <li><Link href="/contact" prefetch={false} className={linkClass}>{copy.contactForm}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bundesländer pill row (Figma) — static place names, not links */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="mb-4 text-base font-medium text-white">{copy.regions}</p>
          <ul className="flex flex-wrap gap-2.5">
            {BUNDESLAENDER.map((name) => (
              <li key={name} className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-1.5 text-sm text-white/80">
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">
            © {currentYear} SVÖ — {t('rights')}
          </p>
          <nav aria-label={tLegal('legalNotice')}>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} prefetch={false} className="text-xs text-white/55 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
