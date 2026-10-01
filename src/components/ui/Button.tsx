import type { AnchorHTMLAttributes } from 'react'
import { SmartLink } from './SmartLink'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant
  size?: Size
  as?: 'a' | 'button'
  href?: string
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-green text-white hover:bg-brand-green-dk border border-transparent',
  secondary:
    'bg-brand-blue text-white hover:bg-brand-navy border border-transparent',
  outline:
    'bg-transparent text-brand-blue border border-brand-blue hover:bg-brand-blue hover:text-white',
  ghost:
    'bg-transparent text-ink-70 border border-transparent hover:text-ink hover:bg-cream',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  children,
  ...props
}: Props) {
  const classes = `
    inline-flex items-center gap-2 font-semibold rounded-control
    transition-colors duration-150
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim()

  // Without an href there's nothing to navigate to — keep the bare anchor so a
  // disabled/decorative call site renders the same as before.
  if (!href) {
    return (
      <a {...props} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <SmartLink {...props} href={href} className={classes}>
      {children}
    </SmartLink>
  )
}
