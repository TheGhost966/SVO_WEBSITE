'use client'

import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { useParams } from 'next/navigation'

const localeLabels: Record<string, string> = {
  de: 'DE',
  ar: 'عربي',
  en: 'EN',
}

type Props = { locale: string }

export function LanguageSwitcher({ locale }: Props) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  const switchLocale = (next: string) => {
    // next-intl router handles pathname translation between locales;
    // we cast to any to work around the strict template-path typing
    router.replace(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { pathname, params } as any,
      { locale: next },
    )
  }

  return (
    <div
      className="flex items-center gap-1 rounded-control border border-border p-0.5"
      role="group"
      aria-label="Sprache wählen / Select language / اختر اللغة"
    >
      {routing.locales.map((loc) => {
        const isActive = loc === locale
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchLocale(loc)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-[8px] transition-colors ${
              isActive
                ? 'bg-brand-blue text-white'
                : 'text-ink-70 hover:text-ink hover:bg-cream'
            }`}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`${localeLabels[loc]} — ${loc}`}
          >
            {localeLabels[loc]}
          </button>
        )
      })}
    </div>
  )
}
