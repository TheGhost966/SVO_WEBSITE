export const CONTACT_CATEGORY_VALUES = [
  'general',
  'legal',
  'events',
  'membership',
  'press',
  'volunteering',
  'idea',
  'other',
] as const

export type ContactCategory = (typeof CONTACT_CATEGORY_VALUES)[number]

export function isContactCategory(value: string | null | undefined): value is ContactCategory {
  return !!value && (CONTACT_CATEGORY_VALUES as readonly string[]).includes(value)
}
