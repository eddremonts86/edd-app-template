import { Link } from '@tanstack/react-router'

interface FooterColumnProps {
  title: string
  items: { label: string; to: string }[]
}

export function FooterColumn({ title, items }: FooterColumnProps) {
  return (
    <div className="lg:col-span-1">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, itemIndex) => (
          <li key={itemIndex}>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={item.to as any}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
