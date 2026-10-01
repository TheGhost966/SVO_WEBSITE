/**
 * S2 — contact submissions: the public write path is the contact-form server action only.
 *
 * Fix:
 *  - src/collections/ContactSubmissions.ts: access.create = isEditorOrAbove (no anonymous REST);
 *    maxLength on every text field; consentGiven must be true on create; a beforeChange hook sets
 *    status='new' + submittedAt=now on create and keeps submittedAt immutable on update.
 *  - src/lib/contactAction.ts: honeypot, per-IP rate limit (5 / 10 min), length / email / category /
 *    locale validation, explicit field whitelist.
 *
 * History: this file previously held "REPRODUCES S2" characterization tests (QA_FINDINGS_P0.md).
 * Each REST probe is kept and now asserts the secure outcome; form-path tests are new.
 *
 * Form tests submit through the real server action (harness/forms.ts — browser no-JS submission).
 * Each test uses its own X-Forwarded-For value so the per-IP limiter doesn't couple tests.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, inject, it } from 'vitest'
import { Api, qs } from '../harness/api'
import { submitPageForm } from '../harness/forms'
import { writeEvidence } from '../harness/evidence'
import { APP_ROOT } from '../harness/paths'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const admin = fx.tokens.admin

const messages = JSON.parse(readFileSync(path.join(APP_ROOT, 'src/messages/de.json'), 'utf8')).contact as Record<string, string>
/** next-intl/React escape apostrophes etc. in HTML; the German strings used here have none. */
const has = (html: string, key: string) => html.includes(messages[key])

let n = 0
const unique = (tag: string) => `qa-s2-${tag}-${Date.now()}-${n++}@test.invalid`
let ipSeq = 10
const freshIp = () => `203.0.113.${ipSeq++}`

const base = () => ({ name: 'QA Anonymous', email: unique('rest'), message: 'Anonymous REST submission' })
const validForm = (email: string) => ({
  locale: 'de',
  name: 'QA Form User',
  email,
  subject: 'QA subject',
  category: '',
  message: 'Hello, this is a legitimate QA contact message.',
  consent: 'on',
})

const contactPage = `${fx.baseUrl}/de/kontakt`
const submitForm = (fields: Record<string, string>, ip = freshIp()) => submitPageForm(contactPage, 'name="message"', fields, { ip })

async function storedByEmail(email: string) {
  const res = await api.get(`/api/contact-submissions?depth=0&${qs({ where: { email: { equals: email } } })}`, admin)
  expect(res.status).toBe(200)
  return res.body.docs as Array<Record<string, unknown>>
}

const evidence: Record<string, unknown> = {}

describe('S2 — REST path is closed to the public', () => {
  it('REGRESSION S2: anonymous POST /api/contact-submissions is rejected (403) and nothing is stored', async () => {
    const body = { ...base(), consentGiven: true }
    const res = await api.post('/api/contact-submissions', body)
    evidence.anonymousCreate = { status: res.status, body: res.body }
    expect(res.status).toBe(403)
    expect(await storedByEmail(body.email)).toHaveLength(0)
  })

  it('REGRESSION S2: viewer POST is rejected too (403)', async () => {
    const res = await api.post('/api/contact-submissions', { ...base(), consentGiven: true }, fx.tokens.viewer)
    expect(res.status).toBe(403)
  })

  it('REGRESSION S2: 30 back-to-back anonymous REST submissions are all rejected (no write path to rate-limit)', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 30; i++) statuses.push((await api.post('/api/contact-submissions', { ...base(), consentGiven: true })).status)
    evidence.burst = { statuses: [...new Set(statuses)] }
    expect(statuses.every((s) => s === 403)).toBe(true)
  })

  it('control: anonymous callers still cannot read submissions', async () => {
    expect((await api.get('/api/contact-submissions')).status).toBe(403)
    expect((await api.get(`/api/contact-submissions/${fx.contactSubmissionId}`)).status).toBe(403)
  })
})

describe('S2 — collection rules hold on every write path (editor REST)', () => {
  it('REGRESSION S2: consent false or omitted is rejected (400)', async () => {
    const f = await api.post('/api/contact-submissions', { ...base(), consentGiven: false }, fx.tokens.editor)
    const o = await api.post('/api/contact-submissions', base(), fx.tokens.editor)
    evidence.editorConsent = { false: f.status, omitted: o.status }
    expect(f.status).toBe(400)
    expect(o.status).toBe(400)
  })

  it('REGRESSION S2: oversized fields are rejected (400) — name > 200, message > 5000', async () => {
    const longName = await api.post('/api/contact-submissions', { ...base(), name: 'N'.repeat(201), consentGiven: true }, fx.tokens.editor)
    const longMsg = await api.post('/api/contact-submissions', { ...base(), message: 'M'.repeat(5001), consentGiven: true }, fx.tokens.editor)
    evidence.editorOversized = { name201: longName.status, message5001: longMsg.status }
    expect(longName.status).toBe(400)
    expect(longMsg.status).toBe(400)
  })

  it('REGRESSION S2: status and submittedAt sent by the caller are overridden on create', async () => {
    const before = Date.now()
    const res = await api.post(
      '/api/contact-submissions',
      { ...base(), consentGiven: true, status: 'archived', submittedAt: '2000-01-01T00:00:00.000Z' },
      fx.tokens.editor,
    )
    expect(res.status, res.text.slice(0, 300)).toBe(201)
    const doc = (await api.get(`/api/contact-submissions/${res.body.doc.id}`, admin)).body
    evidence.editorWorkflowFields = { status: doc.status, submittedAt: doc.submittedAt }
    expect(doc.status).toBe('new')
    expect(Date.parse(doc.submittedAt)).toBeGreaterThanOrEqual(before - 5_000)
  })

  it('inbox workflow preserved: editor can change status; submittedAt stays immutable', async () => {
    const created = await api.post('/api/contact-submissions', { ...base(), consentGiven: true }, fx.tokens.editor)
    const original = created.body.doc.submittedAt
    const res = await api.patch(`/api/contact-submissions/${created.body.doc.id}`, { status: 'read', submittedAt: '2000-01-01T00:00:00.000Z' }, fx.tokens.editor)
    expect(res.status, res.text.slice(0, 300)).toBe(200)
    expect(res.body.doc.status).toBe('read')
    expect(res.body.doc.submittedAt).toBe(original)
  })
})

describe('S2 — the public contact form (server action) works and validates', () => {
  it('legitimate submission succeeds: success message shown, record stored with server-set status/submittedAt', async () => {
    const email = unique('form-ok')
    const before = Date.now()
    const res = await submitForm(validForm(email))
    const docs = await storedByEmail(email)
    evidence.formSuccess = { status: res.status, successShown: has(res.html, 'success'), stored: docs }
    expect(res.status).toBe(200)
    expect(has(res.html, 'success')).toBe(true)
    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ name: 'QA Form User', status: 'new', consentGiven: true, locale: 'de' })
    expect(Date.parse(docs[0].submittedAt as string)).toBeGreaterThanOrEqual(before - 5_000)
  })

  it('REGRESSION S2: missing consent is rejected with the consent message; nothing stored', async () => {
    const email = unique('form-noconsent')
    const fields: Record<string, string> = validForm(email)
    delete fields.consent
    const res = await submitForm(fields)
    expect(has(res.html, 'validationConsent')).toBe(true)
    expect(await storedByEmail(email)).toHaveLength(0)
  })

  it('REGRESSION S2: invalid data is rejected — bad email, missing name, message < 10 chars', async () => {
    const badEmail = await submitForm({ ...validForm('not-an-email'), email: 'not-an-email@nodot' })
    const noName = await submitForm({ ...validForm(unique('noname')), name: '' })
    const shortEmail = unique('short')
    const short = await submitForm({ ...validForm(shortEmail), message: 'too short' })
    expect(has(badEmail.html, 'validationEmail')).toBe(true)
    expect(has(noName.html, 'validationName')).toBe(true)
    expect(has(short.html, 'validationMessage')).toBe(true)
    expect(await storedByEmail(shortEmail)).toHaveLength(0)
  })

  it('REGRESSION S2: oversized input is rejected with the too-long message; nothing stored', async () => {
    const email = unique('form-long')
    const res = await submitForm({ ...validForm(email), message: 'M'.repeat(5001) })
    const resName = await submitForm({ ...validForm(email), name: 'N'.repeat(201) })
    evidence.formOversized = { message: has(res.html, 'validationTooLong'), name: has(resName.html, 'validationTooLong') }
    expect(has(res.html, 'validationTooLong')).toBe(true)
    expect(has(resName.html, 'validationTooLong')).toBe(true)
    expect(await storedByEmail(email)).toHaveLength(0)
  })

  it('REGRESSION S2: status / submittedAt / consentGiven injected as extra form fields are ignored', async () => {
    const email = unique('form-inject')
    const before = Date.now()
    const res = await submitForm({ ...validForm(email), status: 'archived', submittedAt: '2000-01-01T00:00:00.000Z', consentGiven: 'false' })
    const docs = await storedByEmail(email)
    evidence.formInjection = { successShown: has(res.html, 'success'), stored: docs.map((d) => ({ status: d.status, submittedAt: d.submittedAt })) }
    expect(docs).toHaveLength(1)
    expect(docs[0].status).toBe('new')
    expect(docs[0].consentGiven).toBe(true)
    expect(Date.parse(docs[0].submittedAt as string)).toBeGreaterThanOrEqual(before - 5_000)
  })

  it('unknown category / locale values are not stored verbatim (whitelisted)', async () => {
    const email = unique('form-whitelist')
    await submitForm({ ...validForm(email), category: '<script>x</script>', locale: 'xx' })
    const docs = await storedByEmail(email)
    expect(docs).toHaveLength(1)
    expect(docs[0].category ?? null).toBeNull()
    expect(docs[0].locale).toBe('de')
  })

  it('honeypot: a filled `company` field reports success to the bot but stores nothing', async () => {
    const email = unique('form-bot')
    const res = await submitForm({ ...validForm(email), company: 'Bot GmbH' })
    expect(has(res.html, 'success')).toBe(true)
    expect(await storedByEmail(email)).toHaveLength(0)
  })

  it('REGRESSION S2: rate limit — 5 submissions per IP per 10 minutes, the 6th is refused and not stored', async () => {
    const ip = freshIp()
    const results: boolean[] = []
    for (let i = 0; i < 5; i++) results.push(has((await submitForm(validForm(unique(`rl-${i}`)), ip)).html, 'success'))
    const sixthEmail = unique('rl-6')
    const sixth = await submitForm(validForm(sixthEmail), ip)
    const otherIp = await submitForm(validForm(unique('rl-other')), freshIp())
    evidence.rateLimit = { firstFive: results, sixthLimited: has(sixth.html, 'rateLimited'), otherIpOk: has(otherIp.html, 'success') }
    writeEvidence('s2-contact-submissions', evidence)
    expect(results).toEqual([true, true, true, true, true])
    expect(has(sixth.html, 'rateLimited')).toBe(true)
    expect(await storedByEmail(sixthEmail)).toHaveLength(0)
    expect(has(otherIp.html, 'success')).toBe(true)
  })
})
