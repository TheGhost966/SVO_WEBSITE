'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { checkRateLimit } from '@/lib/rateLimit'
import { CONTACT_LIMITS, CONTACT_MESSAGE_MIN } from '@/lib/contactLimits'
import { CONTACT_CATEGORY_VALUES } from '@/lib/contactCategories'

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  errorKey?: 'required' | 'invalid_email' | 'short_message' | 'too_long' | 'no_consent' | 'rate_limited' | 'server_error'
}

const LOCALES = ['de', 'ar', 'en'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// SECURITY (QA S2): this server action is the ONLY public write path for contact submissions —
// ContactSubmissions.access.create is no longer public. It writes through the Local API with an
// explicit field whitelist; status and submittedAt are set by the collection's beforeChange hook.
export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot — hidden from real users via CSS (same pattern as the expert application form).
  if ((formData.get('company') as string | null)?.trim()) {
    return { status: 'success' }
  }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const subject = (formData.get('subject') as string | null)?.trim() ?? ''
  const rawCategory = (formData.get('category') as string | null)?.trim() ?? ''
  const message = (formData.get('message') as string | null)?.trim() ?? ''
  const consent = formData.get('consent') === 'on'
  const rawLocale = (formData.get('locale') as string | null) ?? 'de'
  const locale = (LOCALES as readonly string[]).includes(rawLocale) ? rawLocale : 'de'
  const category = (CONTACT_CATEGORY_VALUES as readonly string[]).includes(rawCategory) ? rawCategory : ''

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!name || !email || !message) return { status: 'error', errorKey: 'required' }
  if (
    name.length > CONTACT_LIMITS.name ||
    email.length > CONTACT_LIMITS.email ||
    subject.length > CONTACT_LIMITS.subject ||
    message.length > CONTACT_LIMITS.message
  ) {
    return { status: 'error', errorKey: 'too_long' }
  }
  if (!EMAIL_RE.test(email)) return { status: 'error', errorKey: 'invalid_email' }
  if (message.length < CONTACT_MESSAGE_MIN) return { status: 'error', errorKey: 'short_message' }
  if (!consent) return { status: 'error', errorKey: 'no_consent' }

  // Per-IP throttling — 5 messages per 10 minutes. Same in-memory limiter as the expert form
  // (see src/lib/rateLimit.ts for its single-instance caveat).
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return { status: 'error', errorKey: 'rate_limited' }
  }

  try {
    const payload = await getPayloadClient()

    // ── Save to CMS ──────────────────────────────────────────────────────────
    await payload.create({
      collection: 'contact-submissions',
      data: {
        // Explicit field whitelist — never spread formData into this object.
        name,
        email,
        subject: subject || undefined,
        category: category || undefined,
        message,
        locale: locale as (typeof LOCALES)[number],
        consentGiven: true,
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
