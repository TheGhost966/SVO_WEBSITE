import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getPayloadClient } from '@/lib/payload'

type Props = { params: Promise<{ locale: string; pillar: string }> }

export default async function PillarPage({ params }: Props) {
  const { locale, pillar } = await params
  setRequestLocale(locale)

  let pillarDoc: { title?: string | null; description?: string | null } | null = null
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'service-pillars',
      where: { slug: { equals: pillar } },
      locale: locale as 'de' | 'ar' | 'en',
      depth: 1,
      limit: 1,
    })
    pillarDoc = (result.docs[0] as any) ?? null
  } catch {
    notFound()
  }

  if (!pillarDoc) notFound()

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <h1 className="text-3xl font-bold text-ink mb-4">{pillarDoc.title}</h1>
      {pillarDoc.description && <p className="text-ink-70">{pillarDoc.description}</p>}
      <p className="mt-8 text-ink-50 text-sm">[{locale.toUpperCase()}] Einzelne Leistungen folgen nach Freigabe.</p>
    </div>
  )
}
