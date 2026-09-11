'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

type Props = { locale: string }

const navKeys = ['news', 'events', 'services', 'contact'] as const

const navHrefs: Record<string, string> = {
  news: '/news',
  events: '/events',
  services: '/services',
  contact: '/contact',
}

export function Header({ locale }: Props) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border shadow-sm">
      <div
        className="mx-auto flex max-w-[var(--max-w-content)] items-center justify-between gap-4 px-6 py-4"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {/* Logo / wordmark */}
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-blue text-xl leading-none">
          SVÖ
        </Link>

        {/* Desktop nav */}
        <nav aria-label={t('home')} className="hidden md:flex items-center gap-1">
          {navKeys.map((key) => {
            const href = navHrefs[key] as any
            const isActive = pathname.startsWith(`/${key}`)
            return (
              <Link
                key={key}
                href={href}
                className={`px-4 py-2 rounded-control text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-green-lt text-brand-green-dk'
                    : 'text-ink-70 hover:text-ink hover:bg-cream'
                }`}
              >
                {t(key)}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-control text-ink hover:bg-cream"
            aria-label={menuOpen ? t('closeMenu') : t('menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          className="md:hidden border-t border-border bg-surface px-6 pb-4"
          aria-label={t('menu')}
        >
          {navKeys.map((key) => {
            const href = navHrefs[key] as any
            return (
              <Link
                key={key}
                href={href}
                className="block py-3 text-sm font-medium text-ink border-b border-border last:border-0"
                onClick={() => setMenuOpen(false)}
              >
                {t(key)}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
