type Props = { locale: string }

const messages: Record<string, string> = {
  de: 'Dieser Inhalt ist auf Deutsch verfügbar. Eine Übersetzung folgt in Kürze.',
  ar: 'هذا المحتوى متوفر باللغة الألمانية. الترجمة قادمة قريبًا.',
  en: 'This content is available in German. A translation is coming soon.',
}

/**
 * Shown when content falls back to German for Arabic / English locales.
 * Non-alarming — just a small notice, not a full error state.
 */
export function FallbackNotice({ locale }: Props) {
  if (locale === 'de') return null
  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-ink-50 border border-border rounded-control px-3 py-1.5 bg-cream">
      <span aria-hidden="true">🌐</span>
      {messages[locale]}
    </p>
  )
}
