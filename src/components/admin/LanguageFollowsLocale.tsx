'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useLocale, useTranslation } from '@payloadcms/ui'

/**
 * Payload has two language settings: the content language (the selector in the header — which
 * translation of a document is being edited) and the language of the panel itself (buttons,
 * labels, help texts, reading direction — set on the account page). Changing the first leaves the
 * second alone, so picking "العربية" in the header kept a German, left-to-right panel.
 *
 * Here the panel follows the selector: choosing a content language also switches the panel to it,
 * and Payload renders Arabic right-to-left. Only a change of the selector does this — the language
 * chosen on the account page stays in effect until the selector is used again.
 *
 * Registered in `admin.components.providers` (src/payload.config.ts).
 */
export function LanguageFollowsLocale({ children }: { children: ReactNode }) {
  const code = useLocale()?.code
  const { i18n, languageOptions, switchLanguage } = useTranslation()
  const previous = useRef(code)

  useEffect(() => {
    if (!code || code === previous.current) return
    previous.current = code
    const supported = languageOptions?.some((option) => option.value === code)
    if (supported && code !== i18n.language) void switchLanguage?.(code as Parameters<NonNullable<typeof switchLanguage>>[0])
  }, [code, i18n.language, languageOptions, switchLanguage])

  return children
}
