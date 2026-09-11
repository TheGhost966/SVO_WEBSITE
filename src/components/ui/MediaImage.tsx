import Image from 'next/image'
import type { ResolvedMedia } from '@/types/payload'

type Props = {
  media: ResolvedMedia | string | null | undefined
  size?: 'thumbnail' | 'card' | 'hero' | 'original'
  fill?: boolean
  className?: string
  priority?: boolean
  alt?: string
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
export function MediaImage({ media, size = 'card', fill, className, priority, alt }: Props) {
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
        sizes="(max-width: 768px) 100vw, 50vw"
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
    />
  )
}
