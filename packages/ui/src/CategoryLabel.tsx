import Link from 'next/link'
import type { CategoryRef, Locale } from '@nagarikwatch/db'
import { cn } from './cn'

/**
 * Category accent pill. Renders the `.category-pill` base class (brand-tint background,
 * brand-strong text, no side-stripe per the impeccable ban). Links to the locale-correct
 * category landing page; pass `as="span"` to render non-interactive (e.g. inside a link).
 */
type CategoryLabelProps = {
  category: CategoryRef
  locale: Locale
  prefix?: string
  as?: 'link' | 'span'
  className?: string
}

export function CategoryLabel({
  category,
  locale,
  prefix = '',
  as = 'link',
  className,
}: CategoryLabelProps) {
  const label = locale === 'en' && category.nameEn ? category.nameEn : category.nameNe
  const href = `${locale === 'en' ? '/en' : ''}${prefix}/${category.slug}`

  const content = <span lang={locale === 'en' ? 'en' : 'ne'}>{label}</span>

  if (as === 'span') {
    return <span className={cn('category-pill', className)}>{content}</span>
  }

  return (
    <Link href={href} className={cn('category-pill transition-colors duration-fast ease-out-quint hover:brightness-95', className)}>
      {content}
    </Link>
  )
}
