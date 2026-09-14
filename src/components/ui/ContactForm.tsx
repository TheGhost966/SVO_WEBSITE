'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { submitContactForm, type ContactFormState } from '@/lib/contactAction'

const initial: ContactFormState = { status: 'idle' }

const PRIVACY_PATHS: Record<string, string> = {
  de: '/de/datenschutz',
  ar: '/ar/datenschutz',
  en: '/en/privacy-policy',
}

type Props = { locale: string }

export function ContactForm({ locale }: Props) {
  const t = useTranslations('contact')
  const [state, formAction] = useActionState(submitContactForm, initial)

  if (state.status === 'success') {
    return (
      <div className="rounded-card border border-brand-green bg-brand-green-lt p-8 text-center">
        <p className="text-2xl mb-2" aria-hidden="true">✅</p>
        <p className="font-semibold text-brand-green-dk text-lg">{t('success')}</p>
      </div>
    )
  }

  const errorMessage =
    state.status === 'error'
      ? state.errorKey === 'invalid_email'
        ? t('validationEmail')
        : state.errorKey === 'short_message'
          ? t('validationMessage')
          : state.errorKey === 'no_consent'
            ? t('validationConsent')
            : state.errorKey === 'required'
              ? t('validationName')
              : t('error')
      : null

  const categories = [
    { value: 'general', label: t('categories.general') },
    { value: 'legal', label: t('categories.legal') },
    { value: 'events', label: t('categories.events') },
    { value: 'membership', label: t('categories.membership') },
    { value: 'press', label: t('categories.press') },
    { value: 'other', label: t('categories.other') },
  ]

  const privacyPath = PRIVACY_PATHS[locale] ?? PRIVACY_PATHS.de

  return (
    <form action={formAction} noValidate className="space-y-5">
      {/* Hidden locale */}
      <input type="hidden" name="locale" value={locale} />

      {/* Error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {/* Name + Email row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('name')} required>
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            required
            className={inputClass}
          />
        </Field>
        <Field label={t('email')} required>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            required
            className={inputClass}
          />
        </Field>
      </div>

      {/* Subject + Category row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('subject')}>
          <input
            name="subject"
            type="text"
            placeholder={t('subjectPlaceholder')}
            className={inputClass}
          />
        </Field>
        <Field label={t('category')}>
          <select name="category" className={inputClass} defaultValue="">
            <option value="" disabled>{t('categoryPlaceholder')}</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Message */}
      <Field label={t('message')} required>
        <textarea
          name="message"
          rows={6}
          placeholder={t('messagePlaceholder')}
          required
          minLength={10}
          className={`${inputClass} resize-y`}
        />
      </Field>

      {/* DSGVO consent checkbox */}
      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand-blue accent-brand-blue"
        />
        <label htmlFor="consent" className="text-sm text-ink-70 leading-relaxed">
          {locale === 'ar' ? (
            <>
              أوافق على معالجة بياناتي وفقًا لـ
              <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="underline text-brand-blue hover:text-brand-navy mx-1">
                سياسة الخصوصية
              </a>
              . تُستخدم بياناتي فقط للرد على استفساري.
            </>
          ) : locale === 'en' ? (
            <>
              I consent to the processing of my data in accordance with the{' '}
              <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="underline text-brand-blue hover:text-brand-navy">
                Privacy Policy
              </a>
              . My data will only be used to respond to my enquiry.
            </>
          ) : (
            <>
              Ich stimme der Verarbeitung meiner Daten gemäß der{' '}
              <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="underline text-brand-blue hover:text-brand-navy">
                Datenschutzerklärung
              </a>{' '}
              zu. Meine Daten werden ausschließlich zur Bearbeitung meiner Anfrage genutzt.
            </>
          )}
        </label>
      </div>

      <SubmitButton sendLabel={t('send')} pendingLabel={t('sending')} />
    </form>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
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
