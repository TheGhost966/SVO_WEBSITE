import { notFound } from 'next/navigation'

/**
 * Any path under a locale that no other route matches. Without this, Next answers with its own
 * bare English 404; calling notFound() here renders the localized not-found page inside the site
 * layout (header, footer, language) instead.
 */
export default function CatchAll() {
  notFound()
}
