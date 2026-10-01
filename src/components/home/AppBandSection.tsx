import { BellRing, Search } from 'lucide-react'
import { homeCopy } from './copy'
import { resolveInternalHref } from '@/lib/internalHref'
import { SmartLink } from '@/components/ui/SmartLink'
import { forwardArrow } from '@/i18n/routing'

/**
 * Figma 10.png — navy-to-green gradient card, a phone mock on one side, heading, body and two
 * app-store download buttons.
 *
 * Everything here matches that frame except the two buttons, which are not built. No SVÖ app
 * exists: Phase 1 is the website, and a companion app is named for a later phase in the brief.
 * Store badges linking nowhere would advertise a product the association cannot deliver, which
 * is the same line this project already drew at the fabricated "+1,200 members" figure — so the
 * band states plainly that the app is in preparation and offers the one action that is real:
 * asking to be told when it ships, via the existing contact form.
 *
 * The phone mock is drawn in CSS rather than shipped as an image: it is decorative, it has to
 * mirror correctly in Arabic, and an exported PNG of a UI that does not exist yet would go stale
 * the moment anything changes.
 */
export function AppBandSection({ locale }: { locale: string }) {
  const copy = homeCopy(locale)
  const app = copy.appBand

  return (
    <section className="bg-cream py-16 md:py-[96px]" aria-labelledby="app-band-heading">
      <div
        className="mx-auto max-w-[1200px]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <div className="grid items-center gap-10 overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,var(--color-brand-navy),var(--color-brand-green-dk))] p-8 md:p-12 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16">
          <PhoneMock locale={locale} searchPlaceholder={copy.searchPlaceholder} chips={copy.chips.map((c) => c.label)} />

          <div className="text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.06em] text-white/90">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              {app.badge}
            </span>

            <h2 id="app-band-heading" className="mt-5 text-3xl font-bold leading-tight md:text-4xl">
              {app.heading}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">{app.body}</p>

            {/* Where the Figma puts the two store badges. Stated rather than implied: there is
                nothing to download yet, so nothing here pretends to be a download. */}
            <p className="mt-6 max-w-xl rounded-2xl border border-white/20 bg-white/[0.07] p-4 text-sm leading-relaxed text-white/80">
              {app.note}
            </p>

            <SmartLink
              // Plain /contact, not a `?category=` deep link: ContactSubmissions.category is a
              // Postgres enum and adding an "app" value to it would mean a migration for one
              // button. The general form reaches the same inbox.
              href={resolveInternalHref('/contact', locale)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-white/90"
            >
              {app.button}
              <span aria-hidden="true">{forwardArrow(locale)}</span>
            </SmartLink>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Decorative only — `aria-hidden`, so a screen reader hears the heading and the note rather than
 * a nonsense list of fake UI labels. Reuses the hero's real search placeholder and situation
 * chips so the mock shows this site's actual content rather than invented screenshots.
 */
function PhoneMock({
  locale,
  searchPlaceholder,
  chips,
}: {
  locale: string
  searchPlaceholder: string
  chips: string[]
}) {
  const shown = chips.slice(0, 4)
  return (
    <div className="mx-auto w-full max-w-[280px]" aria-hidden="true">
      <div className="rounded-[26px] border border-white/15 bg-surface p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-brand-blue">SVÖ</span>
          <BellRing className="h-4 w-4 text-ink-50" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-ink-50" />
          <span className="truncate text-[11px] text-ink-50">{searchPlaceholder}</span>
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {shown.map((label, i) => (
            <li
              key={label}
              className={`truncate rounded-xl px-3 py-2.5 text-[11px] font-medium ${
                i === 0
                  ? 'bg-brand-navy text-white'
                  : i === 1
                    ? 'bg-brand-green-lt text-brand-green-dk'
                    : 'border border-border text-ink-70'
              }`}
            >
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[9px] text-ink-50">
          {(locale === 'ar'
            ? ['الرئيسية', 'الدليل', 'الشبكة', 'الفعاليات']
            : locale === 'en'
              ? ['Home', 'Guide', 'Network', 'Events']
              : ['Start', 'Guide', 'Netzwerk', 'Termine']
          ).map((tab, i) => (
            <span key={tab} className={i === 0 ? 'font-semibold text-brand-blue' : undefined}>
              {tab}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
