// Standing notice — "Dies ist keine Rechtsberatung" as a
// fixed layout element, not per-article rich text an editor could accidentally omit.
const TEXT: Record<string, string> = {
  de: 'Dies ist keine Rechtsberatung. Die Angaben dienen der Orientierung und ersetzen keine individuelle Beratung durch eine zuständige Behörde oder eine Rechtsanwältin/einen Rechtsanwalt.',
  ar: 'هذا ليس استشارة قانونية. المعلومات المقدمة هي للتوجيه فقط ولا تغني عن استشارة فردية من الجهة المختصة أو محامٍ.',
  en: 'This is not legal advice. The information here is for orientation only and does not replace individual advice from the responsible authority or a lawyer.',
}

export function GuideDisclaimer({ locale }: { locale: string }) {
  return (
    <div
      role="note"
      className="rounded-control border border-border bg-cream px-4 py-3 text-xs text-ink-70 mb-8"
    >
      {TEXT[locale] ?? TEXT.de}
    </div>
  )
}
