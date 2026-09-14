import * as Sentry from '@sentry/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts, useRouteContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { useDevtoolsVisibility } from '@/modules/settings'
import { AppProviders } from '@/shared/providers'
import { RootErrorContent } from './-root-components/RootErrorContent'

const ReactQueryDevtools = React.lazy(() =>
  import('@tanstack/react-query-devtools').then((d) => ({
    default: d.ReactQueryDevtools,
  })),
)

function DevtoolsWrapper() {
  const visible = useDevtoolsVisibility()

  if (!visible) return null

  return (
    <>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
      <React.Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </React.Suspense>
    </>
  )
}

export function RootDocument({ children }: { children: React.ReactNode }) {
  const { locale } = useRouteContext({ from: '__root__' })

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <AppProviders locale={locale}>
          {children}
          <DevtoolsWrapper />
        </AppProviders>
        <Scripts />
      </body>
    </html>
  )
}

// TanStack Router types `error` as `unknown` — normalize before we use it.
export function RootErrorBoundary({ error }: { error: unknown }) {
  const normalized = error instanceof Error ? error : new Error(String(error))

  // Log error to Sentry
  Sentry.captureException(normalized)

  return <RootErrorContent error={normalized} />
}
