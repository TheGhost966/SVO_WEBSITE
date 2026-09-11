type Props = {
  title: string
  subtitle?: string
  align?: 'start' | 'center'
  as?: 'h2' | 'h3'
}

export function SectionHeader({ title, subtitle, align = 'start', as: Tag = 'h2' }: Props) {
  return (
    <div className={`mb-8 ${align === 'center' ? 'text-center' : 'text-start'}`}>
      <Tag className="text-2xl md:text-3xl font-bold text-ink leading-tight">{title}</Tag>
      {subtitle && (
        <p className="mt-3 text-ink-70 text-base md:text-lg max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  )
}
