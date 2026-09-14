'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

type Props = { locale: string }

// Guide + Roadmaps + Experts combine under one "Ressourcen" dropdown entry
// per BRIEF-AMENDMENT-01 §2.9 — adding each as its own top-level item would
// overflow the header in German. Renamed from "Wegweiser" (Guide+Roadmaps
// only, Slice 2) to "Ressourcen" when Experts joined in Slice 3 — see
// DECISIONS.md.
const navKeys = ['news', 'events', 'services', 'contact'] as const

const navHrefs = {
  news: '/news',
  events: '/events',
  services: '/services',
  contact: '/contact',
} as const

const guideMenuItems = [
  { href: '/guide', key: 'guide' },
  { href: '/roadmaps', key: 'roadmaps' },
  { href: '/experts', key: 'experts' },
] as const

function GuideMenu({ pathname }: { pathname: string }) {
  const t = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const isActive = guideMenuItems.some((item) => pathname.startsWith(`/${item.key}`))

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`px-4 py-2 rounded-control text-sm font-medium transition-colors inline-flex items-center gap-1 ${
          isActive ? 'bg-brand-green-lt text-brand-green-dk' : 'text-ink-70 hover:text-ink hover:bg-cream'
        }`}
      >
        {t('guideMenu')}
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute top-full mt-1 min-w-[180px] bg-surface border border-border rounded-control shadow-md py-1 z-50 start-0"
        >
          {guideMenuItems.map((item) => (
            <li key={item.key} role="none">
              <Link
                role="menuitem"
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-cream transition-colors"
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
            const href = navHrefs[key]
            const isActive = pathname.startsWith(`/${key}`)
            return (
              <span key={key} className="contents">
                <Link
                  href={href}
                  className={`px-4 py-2 rounded-control text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-green-lt text-brand-green-dk'
                      : 'text-ink-70 hover:text-ink hover:bg-cream'
                  }`}
                >
                  {t(key)}
                </Link>
                {key === 'services' && <GuideMenu pathname={pathname} />}
              </span>
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
            const href = navHrefs[key]
            return (
              <span key={key} className="contents">
                <Link
                  href={href}
                  className="block py-3 text-sm font-medium text-ink border-b border-border last:border-0"
                  onClick={() => setMenuOpen(false)}
                >
                  {t(key)}
                </Link>
                {key === 'services' &&
                  guideMenuItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="block py-3 ps-4 text-sm font-medium text-ink-70 border-b border-border last:border-0"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t(item.key)}
                    </Link>
                  ))}
              </span>
            )
          })}
        </nav>
      )}
    </header>
  )
}
