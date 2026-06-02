import { createRootRoute } from '@tanstack/react-router'
import { NotFoundPage } from '@/components/composite/NotFoundPage'
import { initSentry } from '@/shared/lib/sentry'
import appCss from '@/shared/styles/globals.css?url'
import { RootDocument, RootErrorBoundary } from './-root-components'

// Initialize Sentry
initSentry()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'edd App Template',
      },
      {
        name: 'description',
        content: 'Reusable starting point for edd SaaS, landing, and web applications',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  errorComponent: RootErrorBoundary,
  notFoundComponent: NotFoundPage,
})
