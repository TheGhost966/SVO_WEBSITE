import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')
  const tLegal = useTranslations('legal')
  const tNav = useTranslations('nav')

  const currentYear = new Date().getFullYear()

  const legalLinks = [
    { href: '/impressum' as const, label: tLegal('impressum') },
    { href: '/datenschutz' as const, label: tLegal('datenschutz') },
    { href: '/barrierefreiheit' as const, label: tLegal('barrierefreiheit') },
  ]

  return (
    <footer className="bg-brand-navy text-white" aria-label="Footer">
      <div
        className="mx-auto max-w-[var(--max-w-content)] py-12 px-6"
        style={{
          paddingInlineStart: 'clamp(24px, 5vw, 120px)',
          paddingInlineEnd: 'clamp(24px, 5vw, 120px)',
        }}
      >
        {/* Top row */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            <p className="font-bold text-xl mb-2">SVÖ</p>
            <p className="text-white/60 text-sm leading-relaxed">
              Syrischer Verband in Österreich
              <br />
              الاتحاد السوري في النمسا
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label={tNav('home')}>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
              {(
                [
                  { href: '/news' as const, key: 'news' as const },
                  { href: '/events' as const, key: 'events' as const },
                  { href: '/services' as const, key: 'services' as const },
                  { href: '/guide' as const, key: 'guide' as const },
                  { href: '/roadmaps' as const, key: 'roadmaps' as const },
                  { href: '/experts' as const, key: 'experts' as const },
                  { href: '/contact' as const, key: 'contact' as const },
                  { href: '/partners' as const, key: 'partners' as const },
                ]
              ).map(({ href, key }) => (
                <li key={key}>
                  <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors">
                    {tNav(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-xs text-white/40">
            © {currentYear} SVÖ — {t('rights')}
          </p>

          {/* Legal links */}
          <nav aria-label={tLegal('legalNotice')}>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-white/50 hover:text-white/80 transition-colors">
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
