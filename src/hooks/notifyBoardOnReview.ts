import type { CollectionBeforeChangeHook } from 'payload'
import type { SiteSettingsDoc } from '@/types/payload'

/**
 * Sends an email notification to board members when an editor
 * moves a document to `in_review` status.
 *
 * Recipients come from: 1) BOARD_NOTIFICATION_EMAIL env var, 2) SiteSettings.boardNotificationEmails
 */
/** The title and the editor's name are typed by users and end up in an HTML e-mail. */
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const notifyBoardOnReview: CollectionBeforeChangeHook = async ({
  collection,
  data,
  req,
  operation,
  originalDoc,
}) => {
  const isMovingToReview =
    data.reviewStatus === 'in_review' &&
    originalDoc?.reviewStatus !== 'in_review' &&
    (operation === 'update' || operation === 'create')

  if (!isMovingToReview) return data

  try {
    // Collect recipients
    const envEmails =
      process.env.BOARD_NOTIFICATION_EMAIL?.split(',')
        .map((e) => e.trim())
        .filter(Boolean) ?? []

    const settingsEmails: string[] = []
    try {
      const settings = (await req.payload.findGlobal({ slug: 'site-settings' })) as unknown as SiteSettingsDoc
      const items = settings?.boardNotificationEmails ?? []
      settingsEmails.push(...items.map((i) => i.email).filter(Boolean))
    } catch {
      // settings global might not be seeded yet — fall through to env var
    }

    const recipients = [...new Set([...envEmails, ...settingsEmails])]
    if (recipients.length === 0) return data

    // Resolve document title (localized field returns object or string)
    const rawTitle = data.title ?? originalDoc?.title ?? 'Unbekanntes Dokument'
    const title = escapeHtml(String(typeof rawTitle === 'object' ? (rawTitle.de ?? Object.values(rawTitle)[0] ?? '-') : rawTitle))
    const submittedBy = escapeHtml(String(req.user?.name ?? req.user?.email ?? 'Unbekannt'))

    // Straight to the document. A document that is being created has no id yet (this hook runs
    // before the insert), so that case links to the collection's list — and the dashboard's
    // "Wartet auf Freigabe" queue shows it in any case.
    const base = `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/admin`
    const adminUrl = originalDoc?.id
      ? `${base}/collections/${collection.slug}/${originalDoc.id}`
      : `${base}/collections/${collection.slug}`

    await req.payload.sendEmail({
      to: recipients.join(', '),
      subject: `[SVÖ] Inhalt zur Überprüfung: ${typeof rawTitle === 'object' ? (rawTitle.de ?? Object.values(rawTitle)[0] ?? '-') : rawTitle}`,
      html: `
        <p>Guten Tag,</p>
        <p>ein neuer Inhalt wurde zur Überprüfung eingereicht und wartet auf Ihre Freigabe.</p>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Titel:</strong></td><td>${title}</td></tr>
          <tr><td><strong>Eingereicht von:</strong></td><td>${submittedBy}</td></tr>
        </table>
        <p>
          <a href="${adminUrl}" style="background:#4FA845;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">
            Zur Prüfung öffnen
          </a>
        </p>
        <p style="color:#8493A0;font-size:13px;margin-top:24px">
          Diese E-Mail wurde automatisch vom SVÖ-Website-System gesendet.
        </p>
      `,
    })
  } catch (err) {
    // Log but never block the save — a failed notification must not prevent content from being saved
    req.payload.logger.error({ err, msg: 'notifyBoardOnReview: email send failed' })
  }

  return data
}
