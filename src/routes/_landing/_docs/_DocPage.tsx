import { Link } from '@tanstack/react-router'
import { ChevronRight, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

export interface RelatedLink {
  label: string
  to: string
  isExternal?: boolean
}

export interface DocSection {
  id: string
  title: string
}

interface DocPageProps {
  title: string
  summary?: string
  children: ReactNode
  relatedLinks?: RelatedLink[]
  sections?: DocSection[]
}

export function DocPage({
  title,
  summary,
  children,
  relatedLinks,
  sections,
}: DocPageProps) {
  return (
    <div className="doc-page space-y-8">
      {/* Header section */}
      <header className="border-b border-border/40 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        {summary && (
          <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-3xl">
            {summary}
          </p>
        )}
      </header>

      {/* Quick Table of Contents / Anchors Index (if sections are provided) */}
      {sections && sections.length > 0 && (
        <nav className="p-4 rounded-xl border border-border/30 bg-secondary/15 max-w-fit">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            On this page
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Main body content */}
      <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed text-sm md:text-base prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-[0.9em] prose-pre:bg-muted/80 prose-pre:border prose-pre:border-border/40 prose-pre:rounded-xl">
        {children}
      </div>

      {/* Footer / Related links section */}
      {(relatedLinks && relatedLinks.length > 0) && (
        <footer className="mt-12 pt-6 border-t border-border/40">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Next steps & related links
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedLinks.map((link) => {
              const isExt = link.isExternal || link.to.startsWith('http')
              return isExt ? (
                <a
                  key={link.to}
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-border transition-all group"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {link.label}
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ) : (
                <Link
                  key={link.to}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={link.to as any}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 bg-secondary/10 hover:bg-secondary/20 hover:border-border transition-all group"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">
                    {link.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                </Link>
              )
            })}
          </div>
        </footer>
      )}
    </div>
  )
}
