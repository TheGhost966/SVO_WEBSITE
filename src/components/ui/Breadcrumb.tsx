import { Link } from '@/i18n/navigation'

export type BreadcrumbItem = {
  label: string
  href?: Parameters<typeof Link>[0]['href']
}

type Props = { items: BreadcrumbItem[] }

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-50" role="list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="text-border">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span aria-current="page" className="text-ink font-medium truncate max-w-[18ch]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-brand-blue transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
