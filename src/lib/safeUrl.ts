/**
 * External-link safety (QA S16).
 *
 * A URL that came from outside — the public expert application form above all — must not reach an
 * `href` unless it is an absolute http(s) or mailto address. Two layers use this module:
 *  - storage: `validateExternalUrl` on the Payload field (REST, GraphQL, admin and the Local API
 *    call in the public form's server action all go through it);
 *  - render: `safeExternalUrl` where the link is emitted, so a value that predates the validation,
 *    or was written to the database directly, still never becomes a link.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/** The normalised URL when `value` is an absolute http, https or mailto URL — otherwise null. */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const input = value.trim()
  // Browsers strip tabs and newlines out of a URL before parsing it ("java\tscript:…"), so any
  // control character or inner whitespace disqualifies the value outright.
  if (!input || /[\u0000-\u0020\u007f]/.test(input)) return null
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null // relative, scheme-relative ("//host") or otherwise not an absolute URL
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null
  if (url.protocol === 'mailto:') return url.pathname.includes('@') ? url.href : null
  return url.hostname ? url.href : null
}

const MESSAGES: Record<string, string> = {
  de: 'Nur Adressen mit http://, https:// oder mailto: sind erlaubt.',
  ar: 'يُسمح فقط بالعناوين التي تبدأ بـ http:// أو https:// أو mailto:.',
  en: 'Only http://, https:// or mailto: addresses are allowed.',
}

/** Payload text-field validator: empty is fine, anything else must pass `safeExternalUrl`. */
export function validateExternalUrl(value: unknown, language?: string): string | true {
  if (value === null || value === undefined || value === '') return true
  return safeExternalUrl(value) ? true : (MESSAGES[language ?? 'en'] ?? MESSAGES.en)
}

/** What people type into a "website" box: `www.example.org` → `https://www.example.org`. */
export function withDefaultScheme(raw: string): string {
  const input = raw.trim()
  if (!input) return ''
  return /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`
}
