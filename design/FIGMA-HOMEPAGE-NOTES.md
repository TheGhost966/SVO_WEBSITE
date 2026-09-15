# Figma homepage — research notes

> Captured during the planning session that produced `BRIEF-AMENDMENT-02.md`. That file is the
> governing spec for the homepage rebuild — this file is the raw research behind it: the section
> inventory, the component/class mapping, and the query functions each teaser would read from.
> Read `BRIEF-AMENDMENT-02.md` first; it overrides anything here that conflicts (notably §2.4's
> disposition table replaces the "coming soon everywhere" instinct this research initially reached).

**Source**: Figma file *"SVÖ Website – AR-EN Concept"* (fileKey `lHoNyg1UtC4mov2N87RAJz`), frame
`6:2`, the file's only page ("00 · Style Guide"). The Figma MCP server is rate-limited to 20 calls/
month on the connected account's Starter/View plan and was exhausted after ~7 calls exploring this
one frame — the 11 PNGs in `design/figma-homepage-exports/` (exported manually via Figma's own
Export panel) are the only remaining source material; don't expect to pull more from Figma MCP
without a plan/seat upgrade.

## Section inventory (top to bottom, `design/figma-homepage-exports/*.png`)

| # | File | Section | Notes |
|---|---|---|---|
| 1 | `1.png` | Header + Hero | Navy hero, headline, search bar, 4 filter chips, **and** a personalised "your roadmap" progress card (logged-in state) + login/join-us header buttons — all account-shaped, see disposition table below |
| 2 | `2.png` | Stats bar + "How can we help today?" | 4 stats ("+1,200 members" is fabricated — no account system backs it); 4 cards, 4th is dark-navy "don't know where to start" (quiz) |
| 3 | `3.png` | Roadmaps teaser | 3 cards (icon-tile pattern) + green "شو وضعي؟" 4-question quiz CTA band |
| 4 | `4.png` | Austria Guide teaser | 12-topic tile grid |
| 5 | `5.png` | Experts teaser | Dark navy band, 4 expert cards (badge-pill categories), "سجل كخبير" register CTA |
| 6 | `6.png` | Jobs & Opportunities teaser | List-row cards with type tag/company/location/expiry — **richer than our curated-links reality**; real scope is `SiteSettings.jobResourceLinks` (see `DECISIONS.md` "Jobs slice") |
| 7 | `7.png` | Upcoming events teaser | Date-box + tag-pill cards, QR + register button |
| 8 | `8.png` | "I have an idea" / "Be a volunteer" | Two side-by-side CTA cards — both out-of-scope features per `BRIEF-AMENDMENT-01` |
| 9 | `9.png` | News teaser | Gradient category cards |
| 10 | `10.png` | App promo band | iOS/Android app store badges — native app is out of scope |
| 11 | `11.png` | Footer | 5-column layout (Community / Services / Union / Contact + brand), a static 9-Bundesland pill row, bottom legal bar |

## Component / class mapping confirmed against the current codebase

Three Explore agents (block components; card + query patterns; Header/Footer/i18n) covered this in
full during planning. Summary:

### Design tokens already match

`src/app/globals.css` `@theme` tokens were clearly derived from this same Figma file — no hex-value
reverse-engineering needed, reuse directly:
```
--color-brand-navy: #062E57   (hero/footer/experts-band background)
--color-brand-blue: #0B4EA2
--color-brand-green: #4FA845 / --color-brand-green-dk: #3B8A33 / --color-brand-green-lt: #EAF4E7
--color-cream: #F7F6F1        (section background)
--color-surface: #FFFFFF      (card background)
--color-border: #E5E6E0
--radius-card: 14px / --radius-card-lg: 18px / --radius-control: 10px
```

### Existing page-builder blocks (`src/blocks/*.ts` config + `src/components/blocks/*.tsx` render)

| Block | Fits as-is? | Gap |
|---|---|---|
| `HeroBlock` | Headline+subtext+one CTA, navy bg default — yes for a plain hero | No search input, no filter chips, no multi-CTA |
| `StatsBlock` | 1–6 stat items, `light`/`dark`/`green` variants, `grid-cols-2 md:grid-cols-4` | Nothing — but see `BRIEF-AMENDMENT-02` §2.5 on suppressing thin/embarrassing counts |
| `CardGridBlock` | 2/3/4-column card grid, icon or image | No per-card "highlighted/dark" variant — every card renders identically |
| `CTABandBlock` | One full-width band, up to 2 buttons (`green`/`navy`/`blue` variant) | No two-column "twin card" layout (Figma's idea/volunteer pair needs two independent heading+body+CTA blocks, not one band) |
| `LogoGridBlock` | Simple logo strip | Fine as-is, not needed for this page |
| `BlockRenderer` | Switches on `block.blockType` | Adding a new block type = new config in `src/blocks/` + register in `src/collections/Pages.ts` blocks array + new render component + new `case` here |

All five blocks already use logical CSS properties (`paddingInlineStart`/`paddingInlineEnd`) rather
than `left`/`right` — RTL-safe pattern to keep reusing.

### No modal/toast/dialog primitive exists anywhere in the repo

Searched for `Modal`, `Toast`, `Dialog`, `role="dialog"`, `Popover`, `Tooltip` — the only hit is
`src/components/ui/CookieConsent.tsx`, a thin wrapper around the third-party
`vanilla-cookieconsent` package (renders `null` itself; the library owns all DOM/behaviour). If
`BRIEF-AMENDMENT-02` §2.4 leaves anything behind a "coming soon" trigger after its disposition
table is applied, §2.9 specifies the accessibility contract to build it to — but the expected
outcome per §2.4 is that nothing survives, so `ComingSoonButton` most likely isn't needed.

### Card patterns — no shared component for Roadmaps/Guide/Experts, cards are inline JSX

None of `roadmaps/page.tsx`, `guide/page.tsx`, `experts/page.tsx` use a shared `Card` component —
each page inlines its own JSX, but Roadmaps and Guide are near-identical (icon-tile pattern):

```tsx
<Link className="group bg-surface rounded-card border border-border p-8 flex gap-6 hover:border-brand-blue hover:shadow-md transition-all">
  <div className="shrink-0 w-14 h-14 rounded-card flex items-center justify-center text-2xl"
       style={{ backgroundColor: 'var(--color-brand-green-lt)', color: 'var(--color-brand-green-dk)' }}>
    <Icon name={item.icon} fallback="🧭" className="w-7 h-7" />
  </div>
  <div className="flex-1 min-w-0">
    <h2 className="font-bold text-ink text-lg group-hover:text-brand-blue ...">{item.title}</h2>
    {item.description && <p className="text-sm text-ink-70 line-clamp-3">{item.description}</p>}
    <span className="inline-block mt-4 text-sm font-semibold text-brand-blue">{t('viewSteps')} {forwardArrow(locale)}</span>
  </div>
</Link>
```
Grid wrapper: `grid gap-6 sm:grid-cols-2` (2-col, not 3/4).

Experts uses a flatter card with badge-pill categories (no icon tile):
```tsx
<Link className="group bg-surface rounded-card border border-border p-6 hover:border-brand-blue hover:shadow-md transition-all">
  <h2 className="font-bold text-ink text-lg ...">{expert.name}</h2>
  {expert.city && <p className="text-sm text-ink-50 mb-2">{expert.city}</p>}
  <div className="flex flex-wrap gap-1.5 mb-2">
    {expert.categories.map(c => <span className="text-xs bg-brand-green-lt text-brand-green-dk rounded-control px-2 py-0.5">{c.name}</span>)}
  </div>
  {expert.bio && <p className="text-sm text-ink-70 line-clamp-3">{expert.bio}</p>}
  <span className="inline-block mt-3 text-sm font-semibold text-brand-blue">{t('viewProfile')} {forwardArrow(locale)}</span>
</Link>
```
Grid wrapper: `sm:grid-cols-2 lg:grid-cols-3` (matches News/Event's 3-col grid).

`src/components/ui/NewsCard.tsx` and `EventCard.tsx` **are** shared components (used by the
homepage already) — same `bg-surface rounded-card border border-border overflow-hidden ...`
shell, `MediaImage` cover, badge/meta row, `line-clamp` title+excerpt, trailing "read more" link
with `forwardArrow(locale)`.

`src/components/ui/GuideArticleCard.tsx` exists but cards **articles within a topic**, not topics
themselves — not directly reusable for a topic-teaser grid.

`src/app/[locale]/jobs/page.tsx` has no card component at all — a plain `<ul><li>` list reading
`getSiteSettings(locale).jobResourceLinks` (label/url/description only).

### `ButtonLink` (`src/components/ui/Button.tsx`)

Variants: `primary` (green filled), `secondary` (blue filled, hover→navy), `outline` (blue outline),
`ghost` (text-only). Sizes `sm`/`md`/`lg`. Always renders a real `<a>` — the component destructures
an `as` prop in its type but never uses it, so anything that must NOT navigate (a genuine dead link)
cannot use `ButtonLink` as-is.

### Query functions (`src/lib/queries.ts`)

| Function | Signature today | Note for homepage use |
|---|---|---|
| `getLatestNews` | `(locale, limit = 3)` | Already limit-aware, already used by homepage |
| `getUpcomingEvents` | `(locale, limit = 3)` | Already limit-aware, already used by homepage |
| `getServicePillars` | `(locale)` | No limit param, ≤20 docs |
| `getRoadmaps` | `(locale)` | **No limit param**, flat array, ≤100 docs |
| `getGuideTopics` | `(locale)` | **No limit param**, flat array, ≤50 docs, pre-filtered to topics with ≥1 published article |
| `getExperts` | `(locale, categorySlug?)` | **No limit param**, flat array, ≤100 docs |
| `getSiteSettings` | `(locale)` | Global; has `jobResourceLinks` |
| `getExpertCategories` | `()` | — |
| `getGuideArticlesByTopic` | `(topicSlug, locale, page = 1)` | — |

`BRIEF-AMENDMENT-02` §2.7 requires a `limit` param be added to `getRoadmaps`/`getGuideTopics`/
`getExperts` rather than fetching-then-slicing client-side, and requires `Promise.all` + count-only
queries (`limit: 0` / `totalDocs`) instead of fetching a full collection to display a number —
this research had initially planned the slice-client-side shortcut, which §2.7 explicitly forbids.

### Locale path segments (`src/i18n/routing.ts` `pathnames`)

| Route | de | ar | en |
|---|---|---|---|
| `/roadmaps` | `/anleitungen` | `/roadmaps` | `/roadmaps` |
| `/guide` | `/oesterreich-guide` | `/guide` | `/guide` |
| `/experts` | `/experten` | `/experts` | `/experts` |
| `/jobs` | `/stellenangebote` | `/jobs` | `/jobs` |

### Header/Footer current state

- Header nav order: `news → events → services → [Ressourcen dropdown: guide, roadmaps, experts,
  jobs] → contact`, plus `LanguageSwitcher` + mobile hamburger. **No search/login/register
  elements exist today** — confirmed via full read of `Header.tsx` and grep.
- The "Ressourcen" dropdown is a deliberate, documented decision (`BRIEF-AMENDMENT-01` §2.9,
  comment in `Header.tsx`) to avoid nav overflow in German. Figma's flat 4-item nav only reads
  fine because the Arabic labels are short — **do not flatten it to match Figma** (see
  `BRIEF-AMENDMENT-02` §2.6, which generalizes this into the "Figma is a reference, not a pixel
  spec" rule).
- Footer today: brand block + one flat `grid-cols-2` list of all 9 nav links (not grouped/labelled
  sections) + bottom bar (copyright + Impressum/Datenschutz/Barrierefreiheit). No Bundesland pill
  row exists yet.
- No `noContent`/"coming soon" UI pattern exists for nav features — only a content-fallback notice
  (`FallbackNotice.tsx`, `common.noContent` message) for missing translations, unrelated.

## Two deviations already decided (see `DECISIONS.md` once implemented)

1. **Keep the "Ressourcen" nav dropdown** — do not flatten to Figma's 4 separate items (German
   label length).
2. **Stats bar**: don't fabricate "+1,200 members" — `BRIEF-AMENDMENT-02` §2.5 goes further than
   this session's original "substitute real counts" idea: a stat tile only renders when its count
   is ≥ 3, and the whole band is suppressed if fewer than 3 tiles survive (current DB has ~1 expert,
   ~1 guide topic, ~1 roadmap — real counts would currently look worse than a placeholder).

## Why this file exists instead of shipping code this session

`BRIEF-AMENDMENT-02.md` (repo root) identified two blockers before any homepage code should land:

1. `npm run db:migrate` is broken (`DECISIONS.md` → Known issues) — there is currently no way to
   deploy schema changes to production, and homepage work adds more schema surface on top of that.
2. Untranslated localized slugs 404 site-wide on non-default locales. Homepage Guide/Roadmaps
   teasers would promote that bug from "buried behind an index page" to the first thing an `/ar`
   visitor clicks.

Read `BRIEF-AMENDMENT-02.md` §4 for the build order once those are fixed — this research feeds
directly into slice 3 ("Homepage sections") and slice 4 ("Header and footer") of that plan.
