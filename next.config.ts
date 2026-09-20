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

const nextConfig: NextConfig = {
  images: {
    // Vercel Blob public URLs (Media uploads when BLOB_READ_WRITE_TOKEN is set).
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
    formats: ['image/avif', 'image/webp'],
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
