'use server'

import { getPayloadClient } from '@/lib/payload'

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  errorKey?: 'required' | 'invalid_email' | 'short_message' | 'no_consent' | 'server_error'
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const subject = (formData.get('subject') as string | null)?.trim() ?? ''
  const category = (formData.get('category') as string | null)?.trim() ?? ''
  const message = (formData.get('message') as string | null)?.trim() ?? ''
  const consent = formData.get('consent') === 'on'
  const locale = (formData.get('locale') as string | null) ?? 'de'

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name || !email || !message) return { status: 'error', errorKey: 'required' }
  if (!email.includes('@') || !email.includes('.')) return { status: 'error', errorKey: 'invalid_email' }
  if (message.length < 10) return { status: 'error', errorKey: 'short_message' }
  if (!consent) return { status: 'error', errorKey: 'no_consent' }

  try {
    const payload = await getPayloadClient()

    // ── Save to CMS ──────────────────────────────────────────────────────────
    await payload.create({
      collection: 'contact-submissions',
      data: {
        name,
        email,
        subject: subject || undefined,
        category: category || undefined,
        message,
        locale,
        consentGiven: true,
        status: 'new',
        submittedAt: new Date().toISOString(),
      },
    })

    // ── Forward email ─────────────────────────────────────────────────────────
    const forwardTo = process.env.CONTACT_FORWARD_EMAIL
    if (forwardTo) {
      try {
        await payload.sendEmail({
          to: forwardTo,
          replyTo: email,
          subject: `[SVÖ Kontakt] ${subject || 'Neue Anfrage'} (${locale.toUpperCase()})`,
          html: `
            <h2 style="color:#0B4EA2;margin-bottom:16px">Neue Kontaktanfrage vom SVÖ-Website</h2>
            <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif">
              <tr><td style="color:#8493A0;white-space:nowrap">Name</td><td><strong>${name}</strong></td></tr>
              <tr><td style="color:#8493A0">E-Mail</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="color:#8493A0">Betreff</td><td>${subject || '—'}</td></tr>
              <tr><td style="color:#8493A0">Kategorie</td><td>${category || '—'}</td></tr>
              <tr><td style="color:#8493A0">Sprache</td><td>${locale.toUpperCase()}</td></tr>
            </table>
            <h3 style="margin-top:24px;color:#0E1D2B">Nachricht</h3>
            <p style="white-space:pre-wrap;border-inline-start:4px solid #0B4EA2;padding-inline-start:12px;color:#4A5C6B">
              ${message}
            </p>
            <p style="color:#8493A0;font-size:12px;margin-top:24px">
              Diese E-Mail wurde automatisch vom SVÖ-Website-Kontaktformular gesendet.
            </p>
          `,
          text: `Name: ${name}\nE-Mail: ${email}\nBetreff: ${subject}\nKategorie: ${category}\nSprache: ${locale}\n\n${message}`,
        })
      } catch (emailErr) {
        // Email forward failure must NOT block the user success response.
        // The submission is already saved to the CMS.
        console.error('[contactAction] email forward failed:', emailErr)
      }
    }

    return { status: 'success' }
  } catch (err) {
    console.error('[contactAction] submission failed:', err)
    return { status: 'error', errorKey: 'server_error' }
  }
}
