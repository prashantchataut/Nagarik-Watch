import Link from 'next/link'
import type { CategoryRef, Locale } from '@nagarikwatch/db'
import { cn } from './cn'

/**
 * Editorial category kicker: solid brand rectangle (portal desk tag).
 * Links to the locale-correct category landing; pass `as="span"` inside another link.
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
  const href = `${locale === 'en' ? '/en' : ''}${prefix}/${category.slug}/`
  const lang = locale === 'en' && category.nameEn ? 'en' : 'ne'
  const classes = cn('category-pill', className)

  if (as === 'span') {
    return (
      <span className={classes} lang={lang}>
        {label}
      </span>
    )
  }

  return (
    <Link
      href={href}
      lang={lang}
      className={cn(classes, 'transition-colors duration-fast ease-out-quint')}
    >
      {label}
    </Link>
  )
}
