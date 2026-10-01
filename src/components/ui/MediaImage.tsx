import Image from 'next/image'
import type { ResolvedMedia } from '@/types/payload'

type Props = {
  media: ResolvedMedia | string | null | undefined
  size?: 'thumbnail' | 'card' | 'hero' | 'original'
  fill?: boolean
  className?: string
  priority?: boolean
  alt?: string
  /** Override the default `sizes` hint when a call site's layout differs from the token's norm. */
  sizes?: string
}

/**
 * Without a `sizes` hint the browser has no layout information at preload time, assumes the
 * image spans the viewport and picks the largest srcset candidate — a 380px-wide card on a
 * desktop was pulling the 1920w rendition. These map each size token to the width it actually
 * occupies in the layouts that use it (content column caps at 1200px; cards sit in a 3-up grid
 * at `lg`, 2-up at `sm`).
 */
const DEFAULT_SIZES: Record<NonNullable<Props['size']>, string> = {
  thumbnail: '(max-width: 640px) 50vw, 200px',
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px',
  hero: '100vw',
  original: '(max-width: 1200px) 100vw, 1200px',
}

function resolveUrl(media: ResolvedMedia, size: Props['size']): string | null {
  if (size && size !== 'original' && media.sizes?.[size]?.url) {
    return media.sizes[size]!.url!
  }
  return media.url ?? null
}

/**
 * Wraps Next.js Image for Payload media fields.
 * Handles unresolved (string ID) and missing media gracefully.
 */
export function MediaImage({ media, size = 'card', fill, className, priority, alt, sizes }: Props) {
  if (!media || typeof media === 'string') return null

  const url = resolveUrl(media, size)
  if (!url) return null

  const altText = alt ?? media.alt ?? ''
  const w = size === 'hero' ? 1920 : size === 'thumbnail' ? 400 : 768
  const h = size === 'hero' ? 1080 : size === 'thumbnail' ? 300 : 512

  if (fill) {
    return (
      <Image
        src={url}
        alt={altText}
        fill
        className={`object-cover ${className ?? ''}`}
        priority={priority}
        sizes={sizes ?? DEFAULT_SIZES[size]}
      />
    )
  }

  return (
    <Image
      src={url}
      alt={altText}
      width={media.width ?? w}
      height={media.height ?? h}
      className={`w-full h-auto ${className ?? ''}`}
      priority={priority}
      sizes={sizes ?? DEFAULT_SIZES[size]}
      // Anything not painted in the first viewport is worth decoding off the main thread.
      loading={priority ? undefined : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
    />
  )
}
