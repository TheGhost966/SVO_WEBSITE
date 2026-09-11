import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string; pillar: string; service: string }> }

export default async function ServiceDetailPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  // Stub — service detail pages built in the Services slice
  notFound()
}
