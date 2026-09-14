'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { submitExpertApplication, type ExpertApplicationState } from '@/lib/expertApplicationAction'

const initial: ExpertApplicationState = { status: 'idle' }

const PRIVACY_PATHS: Record<string, string> = {
  de: '/de/datenschutz',
  ar: '/ar/datenschutz',
  en: '/en/privacy-policy',
}

type Category = { id: string; name?: string | null }

type Props = { locale: string; categories: Category[] }

export function ExpertApplicationForm({ locale, categories }: Props) {
  const t = useTranslations('experts')
  const [state, formAction] = useActionState(submitExpertApplication, initial)

  if (state.status === 'success') {
    return (
      <div className="rounded-card border border-brand-green bg-brand-green-lt p-8 text-center">
        <p className="text-2xl mb-2" aria-hidden="true">✅</p>
        <p className="font-semibold text-brand-green-dk text-lg">{t('applySuccess')}</p>
      </div>
    )
  }

  const errorMessage =
    state.status === 'error'
      ? state.errorKey === 'invalid_email'
        ? t('applyValidationEmail')
        : state.errorKey === 'no_consent'
          ? t('applyValidationConsent')
          : state.errorKey === 'rate_limited'
            ? t('applyRateLimited')
            : state.errorKey === 'required'
              ? t('applyValidationRequired')
              : t('applyError')
      : null

  const privacyPath = PRIVACY_PATHS[locale] ?? PRIVACY_PATHS.de

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      {/* Honeypot — hidden from real users via CSS, not type="hidden" */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {errorMessage && (
        <div role="alert" className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('applyName')} required>
          <input name="name" type="text" autoComplete="name" required className={inputClass} />
        </Field>
        <Field label={t('applyEmail')} required>
          <input name="contactEmail" type="email" autoComplete="email" required className={inputClass} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('applyPhone')}>
          <input name="contactPhone" type="tel" autoComplete="tel" className={inputClass} />
        </Field>
        <Field label={t('applyCity')}>
          <input name="city" type="text" className={inputClass} />
        </Field>
      </div>

      {categories.length > 0 && (
        <Field label={t('applyCategory')}>
          <select name="category" className={inputClass} defaultValue="">
            <option value="">{t('applyCategoryPlaceholder')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label={t('applyLanguages')}>
        <input name="languages" type="text" placeholder={t('applyLanguagesPlaceholder')} className={inputClass} />
      </Field>

      <Field label={t('applyWebsite')}>
        <input name="website" type="url" placeholder="https://" className={inputClass} />
      </Field>

      <Field label={t('applyBio')}>
        <textarea name="bio" rows={5} className={`${inputClass} resize-y`} />
      </Field>

      <div className="flex items-start gap-3">
        <input
          id="expert-consent"
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-blue accent-brand-blue"
        />
        <label htmlFor="expert-consent" className="text-sm text-ink-70 leading-relaxed">
          {locale === 'ar' ? (
            <>
              أوافق على معالجة بياناتي وفقًا لـ
              <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="underline text-brand-blue hover:text-brand-navy mx-1">
                سياسة الخصوصية
              </a>
              . تُستخدم بياناتي فقط لغرض إدراجي في دليل الخبراء ونشرها بعد الموافقة.
            </>
          ) : locale === 'en' ? (
            <>
              I consent to the processing of my data in accordance with the{' '}
              <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="underline text-brand-blue hover:text-brand-navy">
                Privacy Policy
              </a>
              . My data will only be used to list me in the experts directory once approved.
            </>
          ) : (
            <>
              Ich stimme der Verarbeitung meiner Daten gemäß der{' '}
              <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="underline text-brand-blue hover:text-brand-navy">
                Datenschutzerklärung
              </a>{' '}
              zu. Meine Daten werden ausschließlich verwendet, um mich nach Freigabe im Expert:innen-Verzeichnis zu listen.
            </>
          )}
        </label>
      </div>

      <SubmitButton sendLabel={t('applySend')} pendingLabel={t('applySending')} />
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink">
        {label}
        {required && <span className="ms-1 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  )
}

function SubmitButton({ sendLabel, pendingLabel }: { sendLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-control bg-brand-green text-white font-semibold text-sm transition-colors hover:bg-brand-green-dk disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : sendLabel}
    </button>
  )
}

const inputClass =
  'w-full rounded-control border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-colors'
