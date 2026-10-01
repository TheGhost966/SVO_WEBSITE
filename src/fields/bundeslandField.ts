import type { Field } from 'payload'

// Austria's 9 federal states — a fixed, never-changing enumeration.
// Modeled as a `select`, not a `relationship`: relationships must target a
// collection, and a 9-item constant doesn't warrant one.
export const bundeslandField: Field = {
  name: 'bundesland',
  type: 'select',
  label: { de: 'Bundesland', ar: 'الولاية', en: 'State' },
  options: [
    { value: 'W', label: { de: 'Wien', ar: 'فيينا', en: 'Vienna' } },
    { value: 'NOE', label: { de: 'Niederösterreich', ar: 'النمسا السفلى', en: 'Lower Austria' } },
    { value: 'OOE', label: { de: 'Oberösterreich', ar: 'النمسا العليا', en: 'Upper Austria' } },
    { value: 'SBG', label: { de: 'Salzburg', ar: 'زالتسبورغ', en: 'Salzburg' } },
    { value: 'T', label: { de: 'Tirol', ar: 'تيرول', en: 'Tyrol' } },
    { value: 'VBG', label: { de: 'Vorarlberg', ar: 'فورارلبرغ', en: 'Vorarlberg' } },
    { value: 'STMK', label: { de: 'Steiermark', ar: 'شتايرمارك', en: 'Styria' } },
    { value: 'KTN', label: { de: 'Kärnten', ar: 'كارينثيا', en: 'Carinthia' } },
    { value: 'BGLD', label: { de: 'Burgenland', ar: 'بورغنلاند', en: 'Burgenland' } },
  ],
}

/**
 * Display name for a stored Bundesland code. The codes ('W', 'NOE', …) are what goes in the
 * database; nothing user-facing should ever print them raw.
 */
export function bundeslandLabel(code: string | null | undefined, locale: string): string | null {
  if (!code) return null
  const option = (bundeslandField as { options?: Array<{ value: string; label: Record<string, string> }> }).options?.find(
    (o) => o.value === code,
  )
  if (!option) return null
  const lang = locale === 'ar' || locale === 'en' ? locale : 'de'
  return option.label[lang] ?? option.label.de ?? null
}
