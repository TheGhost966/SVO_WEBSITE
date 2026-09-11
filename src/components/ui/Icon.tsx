import {
  GraduationCap,
  Trophy,
  Heart,
  Scale,
  BookOpen,
  Users,
  Briefcase,
  Home,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Star,
  Globe,
  FileText,
  HelpCircle,
  type LucideProps,
} from 'lucide-react'
import type { FC } from 'react'

type LucideIcon = FC<LucideProps>

const REGISTRY: Record<string, LucideIcon> = {
  'graduation-cap': GraduationCap,
  trophy: Trophy,
  heart: Heart,
  scale: Scale,
  'book-open': BookOpen,
  users: Users,
  briefcase: Briefcase,
  home: Home,
  phone: Phone,
  mail: Mail,
  calendar: Calendar,
  'map-pin': MapPin,
  'external-link': ExternalLink,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  star: Star,
  globe: Globe,
  'file-text': FileText,
  'help-circle': HelpCircle,
}

type Props = Omit<LucideProps, 'name'> & {
  name: string | null | undefined
  fallback?: string
}

/**
 * Renders a Lucide icon by its kebab-case name (as stored in the CMS icon field).
 * Falls back to an emoji character when the name is unknown or missing.
 */
export function Icon({ name, fallback = '📋', className, ...rest }: Props) {
  if (!name) return <span className={className} aria-hidden="true">{fallback}</span>
  const Component = REGISTRY[name]
  if (!Component) return <span className={className} aria-hidden="true">{fallback}</span>
  return <Component className={className} aria-hidden {...rest} />
}
