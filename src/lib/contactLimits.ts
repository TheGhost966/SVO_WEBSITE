/**
 * Length limits for the public contact form, shared by the collection (enforced on every write
 * path), the server action (friendly error before any DB work) and the form (maxLength attributes).
 */
export const CONTACT_LIMITS = {
  name: 200,
  email: 254,
  subject: 200,
  category: 100,
  message: 5000,
} as const

export const CONTACT_MESSAGE_MIN = 10
