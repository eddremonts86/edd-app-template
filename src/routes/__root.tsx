import { createRootRoute } from '@tanstack/react-router'
import { NotFoundPage } from '@/components/composite/NotFoundPage'
import { resolveLocale } from '@/shared/lib/i18n/resolve-locale'
import { initSentry } from '@/shared/lib/sentry'
import appCss from '@/shared/styles/globals.css?url'
import { RootDocument, RootErrorBoundary } from './-root-components'

// Initialize Sentry
initSentry()

export const Route = createRootRoute({
  // Read on the server from the request cookie and on the client from
  // document.cookie — same value either way, so hydration matches.
  beforeLoad: () => ({ locale: resolveLocale() }),

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
