/**
 * Submits a server-action form the way a browser without JavaScript does (progressive
 * enhancement): React server-renders hidden `$ACTION_*` inputs into the <form>; posting them back to
 * the page as multipart/form-data makes Next.js decode and run the server action and re-render the
 * page with the returned state. This exercises the real `submitContactForm` action end to end,
 * with no knowledge of action ids.
 */
const decodeEntities = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of tag.matchAll(/([a-zA-Z_$:\-0-9]+)="([^"]*)"/g)) out[m[1]] = decodeEntities(m[2])
  return out
}

export type FormSubmitResult = { status: number; html: string }

export async function submitPageForm(
  pageUrl: string,
  formMarker: string,
  fields: Record<string, string>,
  opts: { ip?: string } = {},
): Promise<FormSubmitResult> {
  const page = await fetch(pageUrl, { signal: AbortSignal.timeout(180_000) })
  if (page.status !== 200) throw new Error(`GET ${pageUrl} → ${page.status}`)
  const html = await page.text()
  const form = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((m) => m[0]).find((f) => f.includes(formMarker))
  if (!form) throw new Error(`no <form> containing ${formMarker} on ${pageUrl}`)

  const body = new FormData()
  for (const m of form.matchAll(/<input\b[^>]*>/g)) {
    const a = attrs(m[0])
    if (a.type === 'hidden' && a.name?.startsWith('$ACTION')) body.append(a.name, a.value ?? '')
  }
  if (![...body.keys()].length) throw new Error(`form on ${pageUrl} has no $ACTION_* inputs — not a server-action form?`)
  for (const [k, v] of Object.entries(fields)) body.append(k, v)

  const origin = new URL(pageUrl).origin
  const res = await fetch(pageUrl, {
    method: 'POST',
    body,
    headers: { Origin: origin, ...(opts.ip ? { 'X-Forwarded-For': opts.ip } : {}) },
    signal: AbortSignal.timeout(180_000),
  })
  return { status: res.status, html: await res.text() }
}
