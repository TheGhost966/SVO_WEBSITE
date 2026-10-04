import path from 'path'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
// @payloadcms/next has no root export — import from the subpath
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withPayload } = require('@payloadcms/next/withPayload')

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Turbopack's resolveAlias wants a bare specifier or a project-relative path, not an OS-absolute
// one — an absolute path was silently ignored (confirmed empirically: the alias below had zero
// effect until switched to this form). Mirrors exactly how next-intl's own plugin builds its
// `use-intl/format-message` alias (see node_modules/next-intl/dist/esm/development/plugin/getNextConfig.js).
function toTurbopackAliasPath(absolutePath: string): string {
  const relative = path.relative(process.cwd(), absolutePath).replace(/\\/g, '/')
  return relative.startsWith('.') ? relative : `./${relative}`
}

// ─── Security headers (QA S13) ────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production'
/** Media uploads on Vercel Blob — the same host images.remotePatterns allows below. */
const BLOB = 'https://*.public.blob.vercel-storage.com'

const csp = (directives: Record<string, string[]>) =>
  Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ')

/**
 * Public site — enforced. Everything is same-origin: fonts and the cookie banner are self-hosted
 * and there are no third-party scripts, frames or API calls.
 *
 * `script-src` and `style-src` keep 'unsafe-inline': Next.js writes its hydration data as inline
 * <script> blocks, and the alternative (a per-request nonce) forces every page to render
 * dynamically — it would switch off the ISR caching the whole site is built on. What the policy
 * still buys: no script, style, font, frame, form target or connection from any other origin, no
 * plugins, no <base> rewriting, no framing by other sites. Development additionally needs
 * 'unsafe-eval' (React's dev tooling) and websockets (hot reload); a production build gets neither.
 */
const PUBLIC_CSP = csp({
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", ...(isProd ? [] : ["'unsafe-eval'"])],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', BLOB],
  'font-src': ["'self'"],
  'connect-src': ["'self'", ...(isProd ? [] : ['ws:', 'wss:'])],
  'media-src': ["'self'", BLOB],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
})

/**
 * Admin panel — Report-Only on purpose. Payload's admin UI is third-party code whose exact needs
 * (inline styles, blob: previews, direct-to-Blob uploads) have not been observed under an enforced
 * policy yet, and a broken editor is worse than a missing header. This is the policy to enforce
 * once the browser console stays clean of "[Report Only]" entries during normal editing.
 */
const ADMIN_CSP_REPORT_ONLY = csp({
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", ...(isProd ? [] : ["'unsafe-eval'"])],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', BLOB],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", BLOB, 'https://vercel.com', ...(isProd ? [] : ['ws:', 'wss:'])],
  'media-src': ["'self'", 'blob:', BLOB],
  'object-src': ["'none'"],
  'frame-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
})

/** Clickjacking protection is enforced everywhere, the admin panel included — it cannot break a page. */
const FRAME_ANCESTORS_ONLY = "frame-ancestors 'self'"

const BASELINE_SECURITY_HEADERS = [
  // Stops a browser from MIME-sniffing a response into something executable.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak the full URL (including ?q= search terms) to third-party origins.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // For browsers that predate CSP frame-ancestors.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // The site uses none of these; neither may anything that ever gets embedded in it.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
  // Production only: browsers ignore HSTS over plain HTTP anyway, and pinning `localhost` to HTTPS
  // for two years would break every other local dev server. No includeSubDomains / preload — that
  // is a decision about the whole domain (see LAUNCH-CHECKLIST.md).
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }] : []),
]

const nextConfig: NextConfig = {
  // QA harness only (qa/harness/app.ts): every harness server compiles into its own directory
  // under qa/.tmp, so a test run never touches the developer's .next. Unset in normal use → '.next'.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  env: {
    // Inlined at compile time so `if (process.env.SEED_ON_BOOT === '1')` in
    // src/instrumentation.node.ts is a constant: with the variable unset (every normal boot and
    // every production build) the bundler drops that branch and never compiles seed/ at all.
    // `npm run seed` sets it before starting its server.
    SEED_ON_BOOT: process.env.SEED_ON_BOOT ? '1' : '',
  },
  images: {
    // Vercel Blob public URLs (Media uploads when BLOB_READ_WRITE_TOKEN is set).
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
    formats: ['image/avif', 'image/webp'],
    // Optimised renditions are derived from an immutable source URL, so there's no reason to
    // re-run the optimiser (or re-download the bytes) for 60s-old entries — the default. A year
    // matches how long the upstream Blob URL itself is good for.
    minimumCacheTTL: 31536000,
    // The site's images land in a 380px card, a ~760px content column, or full-bleed. Trimming
    // the default ladder (16 widths) to the ones the layouts actually request means fewer
    // optimiser invocations and a smaller srcset per tag.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 200, 256, 384],
  },
  // Compresses HTML/JSON responses. On by default, but stated here because turning it off
  // silently triples the transfer size of the RSC payloads that drive client navigation.
  compress: true,
  // The `X-Powered-By: Next.js` header is a free byte on every single response and tells
  // attackers what to target.
  poweredByHeader: false,
  async headers() {
    return [
      // NB: no rule for `/_next/static/:path*` — Next.js already serves those content-hashed
      // assets as `public, max-age=31536000, immutable`, and `next build` warns that overriding
      // Cache-Control there can break its dev behaviour. The /public paths below get no such
      // treatment by default, which is why they do need rules.
      {
        // Files under /public are served with `max-age=0` by default, so every navigation used
        // to revalidate all eight font files. Their names carry the subset and weight, so a
        // change means a new filename — they're safe to pin for a year.
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Locally-stored Media uploads (the fallback path when BLOB_READ_WRITE_TOKEN is unset).
        // Payload writes a new filename on replace, but not on every edit, so this revalidates
        // daily rather than being pinned outright.
        source: '/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      // QA S13 — see the constants above this config object.
      { source: '/:path*', headers: BASELINE_SECURITY_HEADERS },
      {
        // Public pages: everything except the admin panel, the API, uploaded media and Next's own
        // assets. A negative match, so a public route added later is covered without touching this.
        source: '/((?!admin|api|media|_next).*)',
        headers: [{ key: 'Content-Security-Policy', value: PUBLIC_CSP }],
      },
      {
        source: '/:area(admin|api|media)/:path*',
        headers: [{ key: 'Content-Security-Policy', value: FRAME_ANCESTORS_ONLY }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'Content-Security-Policy-Report-Only', value: ADMIN_CSP_REPORT_ONLY }],
      },
    ]
  },
  turbopack: {
    resolveAlias: {
      // Payload's own dependency `file-type` ships a conditional-exports map where the
      // `"default"` condition (core.js) lacks `fileTypeFromFile`/`fileTypeFromBuffer` — those
      // Node-only variants exist only behind the `"node"` condition (index.js). Turbopack
      // resolves `import { fileTypeFromFile } from 'file-type'` (used by
      // node_modules/payload/dist/uploads/getFileByPath.js) via the `"default"` condition and
      // then hard-fails at build time because that named export genuinely doesn't exist there —
      // `serverExternalPackages` does NOT help here, since that only changes *bundling*
      // behavior, not Turbopack's static named-export validation during the build. Aliasing
      // the bare specifier straight to the file Node's own `require.resolve('file-type')` picks
      // (index.js, which does have both exports) sidesteps the conditional-exports resolution
      // entirely. Confirmed this build failure pre-dates this change (reproduces on unmodified
      // `master`) — see DECISIONS.md "Known issues".
      'file-type': toTurbopackAliasPath(require.resolve('file-type')),
      // Same conditional-exports issue one dependency deeper: file-type/index.js imports strtok3,
      // which has the identical "node" vs. "default" condition split.
      strtok3: toTurbopackAliasPath(require.resolve('strtok3')),
    },
  },
}

export default withPayload(withNextIntl(nextConfig))
