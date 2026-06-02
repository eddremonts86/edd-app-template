import { Link } from '@tanstack/react-router'
import { memo } from 'react'
import { cn } from '@/shared/lib/utils'
import type { NavItem } from './types'

interface NavLinkProps {
  item: NavItem
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void
  className?: string
}

export const NavLink = memo(({ item, onClick, className }: NavLinkProps) => {
  const baseStyles =
    'text-sm font-medium text-foreground/80 hover:text-primary transition-colors'

  if (item.to) {
    return (
      <Link
        to={item.to as '/'}
        className={cn(baseStyles, className)}
        activeProps={{
          className: 'text-foreground font-semibold',
        }}
        onClick={(e) => onClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, item.id)}
      >
        {item.label}
      </Link>
    )
  }

  if (item.href?.startsWith('http')) {
    return (
      <a
        href={item.href}
        className={cn(baseStyles, className)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.label}
      </a>
    )
  }

  return (
    <a
      href={item.href}
      className={cn(baseStyles, className)}
      onClick={(e) => onClick(e, item.id)}
    >
      {item.label}
    </a>
  )
})

NavLink.displayName = 'NavLink'

