'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

type Props = { locale: string }

// Guide + Roadmaps + Experts combine under one "Ressourcen" dropdown entry —
// adding each as its own top-level item would
// overflow the header in German. Renamed from "Wegweiser" (Guide+Roadmaps
// only, Slice 2) to "Ressourcen" when Experts joined in Slice 3.
const navKeys = ['about', 'news', 'events', 'services', 'contact'] as const

const navHrefs = {
  about: '/about',
  news: '/news',
  events: '/events',
  services: '/services',
  contact: '/contact',
} as const

const guideMenuItems = [
  { href: '/guide', key: 'guide' },
  { href: '/roadmaps', key: 'roadmaps' },
  { href: '/experts', key: 'experts' },
  { href: '/jobs', key: 'jobs' },
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
        className={`relative whitespace-nowrap px-2.5 xl:px-4 py-8 text-[15px] font-medium transition-colors inline-flex items-center gap-1 ${
          isActive ? 'text-brand-blue after:absolute after:inset-x-3 after:-bottom-[1px] after:h-[3px] after:rounded-full after:bg-brand-green' : 'text-ink-70 hover:text-brand-blue'
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
          className="absolute top-full -mt-2 min-w-[200px] bg-surface border border-border rounded-2xl shadow-lg py-2 z-50 start-0"
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

  // Every mobile nav link already calls setMenuOpen(false), but that misses the cases where the
  // route changes without one being clicked — the language switcher, the browser's back button,
  // a redirect — and left the panel covering the new page. Adjusting during render rather than in
  // an effect is React's own recommendation for deriving state from a changed input: it closes in
  // the same pass instead of painting the stale open panel first and re-rendering.
  const [menuPathname, setMenuPathname] = useState(pathname)
  if (pathname !== menuPathname) {
    setMenuPathname(pathname)
    setMenuOpen(false)
  }

  // Escape closes the panel, and the page behind it stops scrolling while it's open — without the
  // lock, scrolling the overlay scrolls the page underneath and the user loses their place.
  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div
        className="mx-auto flex max-w-[var(--max-w-content)] items-center justify-between gap-4 px-6 py-0 min-h-[80px]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {/* Logo / wordmark */}
        {/* No logo file exists yet — a wordmark in the Figma's arrangement:
            bold blue "SVÖ" over the association name in green. Swap for the PNG when it arrives. */}
        <Link href="/" className="flex flex-col leading-none" aria-label="SVÖ">
          <span className="text-[28px] font-bold tracking-tight text-brand-blue">SVÖ</span>
          <span className="mt-1 hidden whitespace-nowrap text-[11px] font-medium text-brand-green-dk lg:block">
            {locale === 'ar' ? 'الاتحاد السوري في النمسا' : locale === 'en' ? 'Syrian Association in Austria' : 'Syrischer Verband in Österreich'}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label={t('home')} className="hidden md:flex items-center">
          {navKeys.map((key) => {
            const href = navHrefs[key]
            const isActive = pathname.startsWith(`/${key}`)
            return (
              <span key={key} className="contents">
                <Link
                  href={href}
                  className={`relative whitespace-nowrap px-2.5 xl:px-4 py-8 text-[15px] font-medium transition-colors ${
                    isActive ? 'text-brand-blue after:absolute after:inset-x-3 after:-bottom-[1px] after:h-[3px] after:rounded-full after:bg-brand-green' : 'text-ink-70 hover:text-brand-blue'
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
          {/* "Join us" is a real link to the contact form with the membership
              category preselected — never a dead account-signup button (no accounts exist). */}
          <Link
            href={{ pathname: '/contact', query: { category: 'membership' } }}
            className="hidden sm:inline-flex whitespace-nowrap px-4 xl:px-5 py-3 rounded-xl text-sm font-semibold bg-brand-green text-white hover:bg-brand-green-dk transition-colors"
          >
            {t('joinUs')}
          </Link>

          <LanguageSwitcher locale={locale} />

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-control text-ink hover:bg-cream"
            aria-label={menuOpen ? t('closeMenu') : t('menu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
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
          id="mobile-nav"
          className="md:hidden max-h-[calc(100vh-80px)] overflow-y-auto border-t border-border bg-surface px-6 pb-4"
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
          <Link
            href={{ pathname: '/contact', query: { category: 'membership' } }}
            className="block py-3 text-sm font-semibold text-brand-green-dk"
            onClick={() => setMenuOpen(false)}
          >
            {t('joinUs')}
          </Link>
        </nav>
      )}
    </header>
  )
}
