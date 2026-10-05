import Link from 'next/link'
import type { Payload, PayloadRequest } from 'payload'
import type { AdminLang } from './copy'

/**
 * The two lists a board member opens the admin for, at the top of the dashboard:
 *
 *  - "Wartet auf Freigabe" — everything an editor has set to "in review", across the eight
 *    collections with the review workflow. The e-mail notification is a nudge; this is the queue.
 *  - "Prüfung überfällig" — published guide articles and roadmaps whose `lastReviewedAt` plus
 *    `reviewIntervalMonths` has passed. Both describe procedures at Austrian authorities; the page
 *    prints "Stand: …", and nothing else reminds anyone when that date has gone stale.
 *
 * Read through the Local API with the signed-in user's own access, so nobody sees a title here that
 * they could not open. A collection that fails to load is skipped rather than breaking the panel.
 */

const REVIEWED: Array<{ slug: string; label: Record<AdminLang, string>; titleField: 'title' | 'name' }> = [
  { slug: 'news', label: { de: 'News', ar: 'خبر', en: 'News' }, titleField: 'title' },
  { slug: 'events', label: { de: 'Veranstaltung', ar: 'فعالية', en: 'Event' }, titleField: 'title' },
  { slug: 'guide-articles', label: { de: 'Guide-Artikel', ar: 'مقال الدليل', en: 'Guide article' }, titleField: 'title' },
  { slug: 'roadmaps', label: { de: 'Wegweiser', ar: 'خارطة طريق', en: 'Roadmap' }, titleField: 'title' },
  { slug: 'jobs', label: { de: 'Stellenangebot', ar: 'فرصة عمل', en: 'Job posting' }, titleField: 'title' },
  { slug: 'experts', label: { de: 'Expert:in', ar: 'خبير', en: 'Expert' }, titleField: 'name' },
  { slug: 'services', label: { de: 'Leistung', ar: 'خدمة', en: 'Service' }, titleField: 'title' },
  { slug: 'pages', label: { de: 'Seite', ar: 'صفحة', en: 'Page' }, titleField: 'title' },
]

/** Collections with a review date; both are in REVIEWED above. */
const DATED = ['guide-articles', 'roadmaps']

const COPY: Record<
  AdminLang,
  {
    queueHeading: string
    queueIntroBoard: string
    queueIntroEditor: string
    queueEmpty: string
    overdueHeading: string
    overdueIntro: string
    overdueEmpty: string
    open: string
    since: (date: string) => string
    due: (date: string) => string
    more: (n: number) => string
  }
> = {
  de: {
    queueHeading: 'Wartet auf Freigabe',
    queueIntroBoard: 'Von der Redaktion eingereicht. Öffnen, prüfen, dann den Status auf „Veröffentlicht“ setzen — oder zurück auf „Entwurf“.',
    queueIntroEditor: 'Eingereicht und noch nicht freigegeben. Veröffentlichen kann nur der Vorstand.',
    queueEmpty: 'Nichts wartet auf Freigabe.',
    overdueHeading: 'Prüfung überfällig',
    overdueIntro: 'Veröffentlichte Guide-Artikel und Wegweiser, deren Prüfintervall abgelaufen ist. Inhalt prüfen und „Zuletzt geprüft am“ neu setzen.',
    overdueEmpty: 'Alle Guide-Artikel und Wegweiser sind innerhalb ihres Prüfintervalls.',
    open: 'Öffnen',
    since: (date) => `eingereicht am ${date}`,
    due: (date) => `fällig seit ${date}`,
    more: (n) => `… und ${n} weitere`,
  },
  en: {
    queueHeading: 'Awaiting review',
    queueIntroBoard: 'Submitted by editors. Open, check, then set the status to "Published" — or back to "Draft".',
    queueIntroEditor: 'Submitted and not yet approved. Only the board can publish.',
    queueEmpty: 'Nothing is waiting for review.',
    overdueHeading: 'Review overdue',
    overdueIntro: 'Published guide articles and roadmaps past their review interval. Check the content and set "Last reviewed" again.',
    overdueEmpty: 'Every guide article and roadmap is within its review interval.',
    open: 'Open',
    since: (date) => `submitted ${date}`,
    due: (date) => `due since ${date}`,
    more: (n) => `… and ${n} more`,
  },
  ar: {
    queueHeading: 'بانتظار الموافقة',
    queueIntroBoard: 'محتوى أرسله المحررون. افتحه وراجعه ثم غيّر الحالة إلى «منشور» أو أعده إلى «مسودة».',
    queueIntroEditor: 'أُرسل ولم تتم الموافقة عليه بعد. النشر من صلاحية مجلس الإدارة فقط.',
    queueEmpty: 'لا يوجد محتوى بانتظار الموافقة.',
    overdueHeading: 'مراجعة متأخرة',
    overdueIntro: 'مقالات الدليل وخرائط الطريق المنشورة التي انتهت مدة مراجعتها. راجع المحتوى وحدّث تاريخ «آخر مراجعة».',
    overdueEmpty: 'جميع مقالات الدليل وخرائط الطريق ضمن مدة المراجعة.',
    open: 'فتح',
    since: (date) => `أُرسل في ${date}`,
    due: (date) => `مستحق منذ ${date}`,
    more: (n) => `… و${n} أخرى`,
  },
}

type Row = { key: string; href: string; kind: string; title: string; note: string; sort: number }

const SHOWN = 8

const formatDate = (value: Date) =>
  `${String(value.getDate()).padStart(2, '0')}.${String(value.getMonth() + 1).padStart(2, '0')}.${value.getFullYear()}`

function addMonths(date: Date, months: number): Date {
  const due = new Date(date)
  due.setMonth(due.getMonth() + months)
  return due
}

type Doc = { id: number | string; title?: string | null; name?: string | null; updatedAt?: string; lastReviewedAt?: string | null; reviewIntervalMonths?: number | null }

export async function ReviewQueue({ payload, user, lang, role }: { payload: Payload; user: PayloadRequest['user']; lang: AdminLang; role: string }) {
  // Viewers cannot read unpublished work; there is nothing to list for them.
  if (!['admin', 'board', 'editor'].includes(role)) return null
  const t = COPY[lang]

  const waiting: Row[] = []
  const overdue: Row[] = []
  const now = new Date()

  await Promise.all(
    REVIEWED.map(async (entry) => {
      try {
        const inReview = await payload.find({
          collection: entry.slug as never,
          where: { reviewStatus: { equals: 'in_review' } },
          sort: 'updatedAt',
          depth: 0,
          limit: 25,
          locale: 'de',
          overrideAccess: false,
          user,
        })
        for (const doc of inReview.docs as Doc[]) {
          const updated = doc.updatedAt ? new Date(doc.updatedAt) : now
          waiting.push({
            key: `${entry.slug}-${doc.id}`,
            href: `/admin/collections/${entry.slug}/${doc.id}`,
            kind: entry.label[lang],
            title: doc[entry.titleField] || `#${doc.id}`,
            note: t.since(formatDate(updated)),
            sort: updated.getTime(),
          })
        }

        if (!DATED.includes(entry.slug)) return
        const published = await payload.find({
          collection: entry.slug as never,
          where: { reviewStatus: { equals: 'published' } },
          depth: 0,
          limit: 500,
          locale: 'de',
          overrideAccess: false,
          user,
        })
        for (const doc of published.docs as Doc[]) {
          if (!doc.lastReviewedAt || !doc.reviewIntervalMonths) continue
          const due = addMonths(new Date(doc.lastReviewedAt), doc.reviewIntervalMonths)
          if (due >= now) continue
          overdue.push({
            key: `${entry.slug}-${doc.id}`,
            href: `/admin/collections/${entry.slug}/${doc.id}`,
            kind: entry.label[lang],
            title: doc[entry.titleField] || `#${doc.id}`,
            note: t.due(formatDate(due)),
            sort: due.getTime(),
          })
        }
      } catch {
        // A collection this user cannot read must not break the dashboard.
      }
    }),
  )

  // Oldest first in both lists: the longest-waiting item is the one to open.
  waiting.sort((a, b) => a.sort - b.sort)
  overdue.sort((a, b) => a.sort - b.sort)

  const list = (rows: Row[], pill: 'draft' | 'empty') => (
    <ul className="svo-guide__checklist">
      {rows.slice(0, SHOWN).map((row) => (
        <li key={row.key}>
          <span className={`svo-guide__pill svo-guide__pill--${pill}`}>{row.kind}</span>
          <span className="svo-guide__item">
            <strong>{row.title}</strong>
            <small>{row.note}</small>
          </span>
          <Link className="svo-guide__action" href={row.href}>
            {t.open}
          </Link>
        </li>
      ))}
      {rows.length > SHOWN && (
        <li>
          <span className="svo-guide__item">
            <small>{t.more(rows.length - SHOWN)}</small>
          </span>
        </li>
      )}
    </ul>
  )

  return (
    <div className="svo-guide__row svo-guide__row--even">
      <section className="svo-guide__card" id="svo-review-queue">
        <h3>
          {t.queueHeading}
          {waiting.length > 0 && <span className="svo-guide__count">{waiting.length}</span>}
        </h3>
        <p className="svo-guide__lead">{role === 'editor' ? t.queueIntroEditor : t.queueIntroBoard}</p>
        {waiting.length === 0 ? <p className="svo-guide__done">{t.queueEmpty}</p> : list(waiting, 'draft')}
      </section>

      <section className="svo-guide__card" id="svo-review-overdue">
        <h3>
          {t.overdueHeading}
          {overdue.length > 0 && <span className="svo-guide__count svo-guide__count--late">{overdue.length}</span>}
        </h3>
        <p className="svo-guide__lead">{t.overdueIntro}</p>
        {overdue.length === 0 ? <p className="svo-guide__done">{t.overdueEmpty}</p> : list(overdue, 'empty')}
      </section>
    </div>
  )
}
