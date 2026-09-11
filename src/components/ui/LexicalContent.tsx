import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

type Props = {
  content: unknown
  className?: string
}

/**
 * Renders Payload's Lexical rich text to HTML on the server.
 * Falls back silently on invalid/missing data — never throws.
 */
export function LexicalContent({ content, className }: Props) {
  if (!content) return null

  let html = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    html = convertLexicalToHTML({ data: content as any, disableContainer: true })
  } catch {
    return null
  }

  if (!html.trim()) return null

  return (
    <div
      className={`rich-text ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
