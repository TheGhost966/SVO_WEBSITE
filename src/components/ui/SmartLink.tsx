import NextLink from 'next/link'
import type { AnchorHTMLAttributes } from 'react'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  /** Pass `false` on links far below the fold to keep prefetch traffic down. */
  prefetch?: boolean
}

/**
 * True for anything the Next.js router can't own: absolute URLs, `mailto:`/`tel:`,
 * in-page anchors, and downloads. Those stay plain `<a>` — routing them through
 * `next/link` buys nothing and breaks `target="_blank"` semantics.
 */
function isExternal(href: string): boolean {
  return (
    /^(https?:)?\/\//.test(href) ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  )
}

/**
 * Internal navigation for hrefs that are already resolved to a real, locale-correct
 * public path — CMS-authored strings run through `resolveInternalHref`, and the
 * hand-built query-string URLs pagination and the category filters produce.
 *
 * Those can't go through next-intl's `Link`, whose `href` is a compile-time union of
 * `pathnames` keys, which is why every one of these call sites used a bare `<a>` and so
 * made each click a full document load — new HTML, CSS re-parse, JS re-download, fonts
 * re-fetched. `next/link` takes a plain string, so the same URL gets viewport
 * prefetching and a client-side transition instead. next-intl's own `Link` bottoms out
 * in exactly this: it resolves the key through `getPathname` and hands the resulting
 * string to `next/link`.
 */
export function SmartLink({ href, prefetch, children, ...props }: Props) {
  if (isExternal(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }

  return (
    <NextLink href={href} prefetch={prefetch} {...props}>
      {children}
    </NextLink>
  )
}
