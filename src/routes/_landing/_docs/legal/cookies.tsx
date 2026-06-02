import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/legal/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  const sections = [
    { id: 'cookie-usage', title: 'Cookie Usage' },
    { id: 'cookie-settings', title: 'Managing Cookies' },
  ]

  const relatedLinks = [
    { label: 'Privacy Policy', to: '/legal/privacy' },
    { label: 'Terms of Use', to: '/legal/terms' },
  ]

  return (
    <DocPage
      title="Cookies Policy"
      summary="Cookie usage in the project context."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        This cookies policy explains how our application uses cookies and similar tracking
        technologies to improve your browsing experience.
      </p>

      <h2 id="cookie-usage">Cookie Usage</h2>
      <p>We use cookies for the following purposes:</p>
      <ul>
        <li>
          <strong>Essential Cookies:</strong> Required to keep you signed in, secure your session,
          and store basic site configuration preferences.
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Help us understand how visitors interact with the site
          by gathering anonymous usage statistics.
        </li>
      </ul>

      <h2 id="cookie-settings">Managing Cookies</h2>
      <p>
        You can control and manage cookies using your browser settings. If you block all cookies,
        some features of the application (such as user authentication) may not function correctly.
      </p>
      <p>
        To update your preferences, consult your browser's help documentation for managing cookie
        settings.
      </p>
    </DocPage>
  )
}
