import Link from 'next/link'
import type { ServerProps } from 'payload'
import { COPY, resolveLang } from './copy'
import { CONTENT_MAP, CHECKLIST } from './contentMap'

/**
 * Rendered above the collection cards on `/admin` via `admin.components.beforeDashboard`
 * (registered in `src/payload.config.ts`, wired through `src/app/(payload)/admin/importMap.js`).
 *
 * The SVÖ board are volunteers, not CMS users — landing on a bare grid of fifteen collection
 * cards tells them nothing about what the site needs from them. This answers three questions
 * the dashboard otherwise leaves open: what is still missing, where each content type surfaces
 * on the public site, and how something actually gets published.
 *
 * The checklist reads live counts rather than listing collections statically, because the most
 * common failure mode here is invisible: the homepage hides every section whose collection has
 * no published rows, so an empty database renders as a short, apparently-broken homepage with
 * no indication of why. Naming the empty collections turns that into a to-do list.
 *
 * Runs as a server component so the counts come straight from the Local API — no extra HTTP
 * round trip, and `overrideAccess: false` keeps each count scoped to what this user may read.
 */
export async function DashboardGuide({ payload, i18n, user }: ServerProps) {
  const lang = resolveLang(i18n?.language)
  const t = COPY[lang]
  const isRtl = lang === 'ar'
  const role = (user as { role?: string } | undefined)?.role ?? 'viewer'
  const name = (user as { name?: string; email?: string } | undefined)?.name
    ?? (user as { email?: string } | undefined)?.email
    ?? ''

  const counts = await Promise.all(
    CHECKLIST.map(async (entry) => {
      try {
        const total = await payload.count({ collection: entry.slug as never, overrideAccess: false, user })
        const published = entry.hasReviewStatus
          ? await payload.count({
              collection: entry.slug as never,
              where: { reviewStatus: { equals: 'published' } },
              overrideAccess: false,
              user,
            })
          : total
        return { entry, total: total.totalDocs, published: published.totalDocs }
      } catch {
        // A collection this user cannot read shouldn't break the whole panel.
        return null
      }
    }),
  )

  const rows = counts.filter((row): row is NonNullable<typeof row> => row !== null)
  const outstanding = rows.filter((row) => row.published === 0)
  const roleNote =
    role === 'admin' || role === 'board'
      ? t.workflowRoleBoard
      : role === 'editor'
        ? t.workflowRoleEditor
        : t.workflowRoleViewer

  return (
    <div className="svo-guide" dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{STYLES}</style>

      <header className="svo-guide__intro">
        <h2>{name ? t.greeting(name) : t.greeting('SVÖ')}</h2>
        <p>{t.intro}</p>
      </header>

      {/* ─── What is still missing ─────────────────────────────────────────── */}
      <section className="svo-guide__card">
        <h3>{t.setupHeading}</h3>
        <p className="svo-guide__lead">{t.setupIntro}</p>

        {outstanding.length === 0 ? (
          <p className="svo-guide__done">{t.setupAllDone}</p>
        ) : (
          <ul className="svo-guide__checklist">
            {outstanding.map(({ entry, total }) => (
              <li key={entry.slug}>
                <span className={`svo-guide__pill svo-guide__pill--${total > 0 ? 'draft' : 'empty'}`}>
                  {total > 0 ? t.draftsOnly : t.empty}
                </span>
                <span className="svo-guide__item">
                  <strong>{entry.label[lang]}</strong>
                  <small>{entry.where[lang]}</small>
                </span>
                <Link className="svo-guide__action" href={`/admin/collections/${entry.slug}/create`}>
                  {t.addFirst}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Anything already published still gets a line, so the list reads as progress
            rather than only as a backlog. */}
        {rows.some((row) => row.published > 0) && (
          <ul className="svo-guide__checklist svo-guide__checklist--done">
            {rows
              .filter((row) => row.published > 0)
              .map(({ entry, total, published }) => (
                <li key={entry.slug}>
                  <span className="svo-guide__pill svo-guide__pill--ready">{t.ready}</span>
                  <span className="svo-guide__item">
                    <strong>{entry.label[lang]}</strong>
                    <small>{t.itemsPublished(published, total)}</small>
                  </span>
                  <Link className="svo-guide__action" href={`/admin/collections/${entry.slug}`}>
                    {t.open}
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>

      <div className="svo-guide__row">
        {/* ─── Where does what appear ──────────────────────────────────────── */}
        <section className="svo-guide__card">
          <h3>{t.placementHeading}</h3>
          <p className="svo-guide__lead">{t.placementIntro}</p>
          <table className="svo-guide__table">
            <thead>
              <tr>
                <th>{t.colContent}</th>
                <th>{t.colWhere}</th>
              </tr>
            </thead>
            <tbody>
              {CONTENT_MAP.map((entry) => (
                <tr key={entry.slug}>
                  <td>
                    <Link href={`/admin/collections/${entry.slug}`}>{entry.label[lang]}</Link>
                  </td>
                  <td>{entry.where[lang]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="svo-guide__stack">
          {/* ─── Review workflow ──────────────────────────────────────────── */}
          <section className="svo-guide__card">
            <h3>{t.workflowHeading}</h3>
            <ol className="svo-guide__steps">
              {t.workflowSteps.map((step, i) => (
                <li key={step.name}>
                  <span className="svo-guide__step-no">{i + 1}</span>
                  <span>
                    <strong>{step.name}</strong>
                    <small>{step.body}</small>
                  </span>
                </li>
              ))}
            </ol>
            <p className="svo-guide__role">{roleNote}</p>
          </section>

          {/* ─── Site-wide settings ───────────────────────────────────────── */}
          <section className="svo-guide__card">
            <h3>{t.globalsHeading}</h3>
            <p className="svo-guide__lead">{t.globalsIntro}</p>
            <ul className="svo-guide__globals">
              <li>
                <Link href="/admin/globals/site-settings">{t.siteSettings}</Link>
                <small>{t.siteSettingsBody}</small>
              </li>
              <li>
                <Link href="/admin/globals/navigation">{t.navigation}</Link>
                <small>{t.navigationBody}</small>
              </li>
            </ul>
            <a className="svo-guide__external" href="/de" target="_blank" rel="noreferrer">
              {t.viewSite} ↗
            </a>
          </section>
        </div>
      </div>

      {/* ─── Good to know ───────────────────────────────────────────────────── */}
      <section className="svo-guide__card">
        <h3>{t.gotchaHeading}</h3>
        <ul className="svo-guide__notes">
          {t.gotchas.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/**
 * Inline rather than a `.css` import so the panel travels as one file and can't be broken by a
 * stylesheet-ordering change in the admin bundle. Every colour is one of Payload's own theme
 * variables, so the panel follows the admin's light/dark setting without a second palette.
 * Logical properties throughout (`margin-inline`, `border-inline-start`) keep the Arabic RTL
 * rendering correct.
 */
const STYLES = `
.svo-guide { margin-block-end: 2.5rem; display: flex; flex-direction: column; gap: 1rem; }
.svo-guide__intro h2 { margin: 0 0 .35rem; font-size: 1.5rem; }
.svo-guide__intro p { margin: 0; max-width: 78ch; color: var(--theme-elevation-600); line-height: 1.6; }
.svo-guide__row { display: grid; gap: 1rem; grid-template-columns: 1fr; }
@media (min-width: 1100px) { .svo-guide__row { grid-template-columns: 1.15fr .85fr; align-items: start; } }
.svo-guide__stack { display: flex; flex-direction: column; gap: 1rem; }
.svo-guide__card {
  background: var(--theme-elevation-0);
  border: 1px solid var(--theme-elevation-150);
  border-radius: 6px;
  padding: 1.25rem 1.5rem;
}
.svo-guide__card h3 { margin: 0 0 .35rem; font-size: 1.05rem; }
.svo-guide__lead { margin: 0 0 1rem; color: var(--theme-elevation-600); font-size: .85rem; line-height: 1.55; max-width: 70ch; }
.svo-guide__done { margin: 0; color: var(--theme-success-600); font-size: .9rem; }

.svo-guide__checklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.svo-guide__checklist > li {
  display: flex; align-items: center; gap: .85rem; flex-wrap: wrap;
  padding: .6rem 0; border-block-start: 1px solid var(--theme-elevation-100);
}
.svo-guide__checklist > li:first-child { border-block-start: 0; }
.svo-guide__checklist--done { margin-block-start: .5rem; opacity: .75; }
.svo-guide__item { display: flex; flex-direction: column; flex: 1 1 16rem; min-width: 0; }
.svo-guide__item strong { font-size: .9rem; }
.svo-guide__item small { color: var(--theme-elevation-500); font-size: .75rem; line-height: 1.45; }

.svo-guide__pill {
  flex-shrink: 0; font-size: .68rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .04em; padding: .2rem .5rem; border-radius: 3px; white-space: nowrap;
}
.svo-guide__pill--empty { background: var(--theme-error-100); color: var(--theme-error-750); }
.svo-guide__pill--draft { background: var(--theme-warning-100); color: var(--theme-warning-750); }
.svo-guide__pill--ready { background: var(--theme-success-100); color: var(--theme-success-750); }

.svo-guide__action {
  flex-shrink: 0; font-size: .8rem; font-weight: 600; text-decoration: none;
  color: var(--theme-text); border: 1px solid var(--theme-elevation-200);
  border-radius: 4px; padding: .32rem .7rem; white-space: nowrap;
}
.svo-guide__action:hover { border-color: var(--theme-elevation-400); background: var(--theme-elevation-50); }

.svo-guide__table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.svo-guide__table th {
  text-align: start; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em;
  color: var(--theme-elevation-500); padding-block-end: .5rem; font-weight: 600;
}
.svo-guide__table td { padding: .5rem 0; border-block-start: 1px solid var(--theme-elevation-100); vertical-align: top; }
.svo-guide__table td:first-child { padding-inline-end: 1rem; white-space: nowrap; }
.svo-guide__table td:last-child { color: var(--theme-elevation-600); line-height: 1.5; }
.svo-guide__table a { color: var(--theme-text); text-decoration: none; font-weight: 600; }
.svo-guide__table a:hover { text-decoration: underline; }

.svo-guide__steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .7rem; }
.svo-guide__steps > li { display: flex; gap: .7rem; align-items: flex-start; }
.svo-guide__steps > li > span:last-child { display: flex; flex-direction: column; }
.svo-guide__steps strong { font-size: .86rem; }
.svo-guide__steps small { color: var(--theme-elevation-500); font-size: .76rem; line-height: 1.45; }
.svo-guide__step-no {
  flex-shrink: 0; width: 1.4rem; height: 1.4rem; border-radius: 50%;
  background: var(--theme-elevation-100); color: var(--theme-elevation-700);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 700;
}
.svo-guide__role {
  margin: 1rem 0 0; padding-inline-start: .7rem;
  border-inline-start: 2px solid var(--theme-elevation-200);
  color: var(--theme-elevation-600); font-size: .78rem; line-height: 1.5;
}

.svo-guide__globals { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .7rem; }
.svo-guide__globals a { font-weight: 600; font-size: .86rem; color: var(--theme-text); }
.svo-guide__globals small { display: block; color: var(--theme-elevation-500); font-size: .76rem; line-height: 1.45; }
.svo-guide__external { display: inline-block; margin-block-start: 1rem; font-size: .8rem; font-weight: 600; }

.svo-guide__notes { margin: 0; padding-inline-start: 1.1rem; display: flex; flex-direction: column; gap: .45rem; }
.svo-guide__notes li { color: var(--theme-elevation-600); font-size: .82rem; line-height: 1.55; max-width: 92ch; }
`

export default DashboardGuide
