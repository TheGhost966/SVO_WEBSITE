'use server'

import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { uniqueSlug } from '@/lib/slug'
import { checkRateLimit } from '@/lib/rateLimit'

export type ExpertApplicationState = {
  status: 'idle' | 'success' | 'error'
  errorKey?: 'required' | 'invalid_email' | 'no_consent' | 'rate_limited' | 'server_error'
}

// SECURITY (BRIEF-AMENDMENT-01 §2.1): this is the ONLY sanctioned public
// write path for Experts. It uses the Local API with overrideAccess: true
// (Experts.access.create stays isEditorOrAbove — never opened publicly) and
// whitelists every field explicitly. Never spread formData into payload.create.
export async function submitExpertApplication(
  _prevState: ExpertApplicationState,
  formData: FormData,
): Promise<ExpertApplicationState> {
  // Honeypot — a real applicant never sees or fills this field (hidden via CSS,
  // not `type="hidden"`, so it still trips up simple bots that fill every input).
  if ((formData.get('company') as string | null)?.trim()) {
    // Don't tip the bot off — report success without writing anything.
    return { status: 'success' }
  }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const bio = (formData.get('bio') as string | null)?.trim() ?? ''
  const city = (formData.get('city') as string | null)?.trim() ?? ''
  const languagesRaw = (formData.get('languages') as string | null)?.trim() ?? ''
  const contactEmail = (formData.get('contactEmail') as string | null)?.trim() ?? ''
  const contactPhone = (formData.get('contactPhone') as string | null)?.trim() ?? ''
  const website = (formData.get('website') as string | null)?.trim() ?? ''
  const categoryId = (formData.get('category') as string | null)?.trim() ?? ''
  const consent = formData.get('consent') === 'on'

  if (!name || !contactEmail) return { status: 'error', errorKey: 'required' }
  if (!contactEmail.includes('@') || !contactEmail.includes('.')) {
    return { status: 'error', errorKey: 'invalid_email' }
  }
  if (!consent) return { status: 'error', errorKey: 'no_consent' }

  // Per-IP throttling (§2.1) — 3 applications per hour per IP.
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(`expert-apply:${ip}`, 3, 60 * 60 * 1000)) {
    return { status: 'error', errorKey: 'rate_limited' }
  }

  try {
    const payload = await getPayloadClient()
    const slug = await uniqueSlug(payload, 'experts', name)

    const languages = languagesRaw
      ? languagesRaw.split(',').map((l) => l.trim()).filter(Boolean).map((language) => ({ language }))
      : []

    await payload.create({
      collection: 'experts',
      overrideAccess: true, // Local API bypass — collection access stays isEditorOrAbove
      data: {
        // Explicit field whitelist — never spread `formData` into this object.
        name,
        slug,
        bio: bio || undefined,
        city: city || undefined,
        languages: languages.length > 0 ? languages : undefined,
        contactEmail,
        contactPhone: contactPhone || undefined,
        website: website || undefined,
        categories: categoryId ? [categoryId] : undefined,
        consentOnFile: true,
        consentDate: new Date().toISOString(),
        // Fixed, not user-controlled: applications must reach a human (§2.2) —
        // 'draft' would never trigger notifyBoardOnReview.
        reviewStatus: 'in_review',
        verificationStatus: 'unverified',
        // photo is intentionally not accepted here — see Experts collection comment.
      },
    })

    return { status: 'success' }
  } catch (err) {
    console.error('[expertApplicationAction] submission failed:', err)
    return { status: 'error', errorKey: 'server_error' }
  }
}
