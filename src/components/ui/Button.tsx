import type { AnchorHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant
  size?: Size
  as?: 'a' | 'button'
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
  children,
  ...props
}: Props) {
  return (
    <a
      {...props}
      className={`
        inline-flex items-center gap-2 font-semibold rounded-control
        transition-colors duration-150
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
    >
      {children}
    </a>
  )
}
