import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/product/release-notes')({
  component: ReleaseNotesPage,
})

function ReleaseNotesPage() {
  const sections = [
    { id: 'june-2026', title: 'June 2026 Release' },
    { id: 'upcoming', title: 'Upcoming Releases' },
  ]

  const relatedLinks = [
    { label: 'Version Changelog', to: '/product/changelog' },
    { label: 'Product Roadmap', to: '/product/roadmap' },
  ]

  return (
    <DocPage
      title="Release Notes"
      summary="Narrative updates: what's new, what's improved, and guidance."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Detailed narrative overviews of major changes, the reasoning behind updates, and
        instructions on how to use new features.
      </p>

      <h2 id="june-2026">June 2026 Release (v0.1.0 & v0.1.1)</h2>
      <p>
        We are excited to launch the first versions of edd Starter. This release focuses on
        providing a clean, modular layout for SaaS apps, complete with type-safe routing, database
        integration, and local AI capabilities.
      </p>
      <h3>Key Highlights</h3>
      <ul>
        <li>
          <strong>Modular Architecture:</strong> Separates code into Domain Modules and Shared
          Utilities to prevent circular imports and keep features isolated.
        </li>
        <li>
          <strong>Integrated Documentation Layout:</strong> Responsive sidebars and standard
          typography formatting designed to host your user guides, privacy notices, and release
          logs.
        </li>
        <li>
          <strong>SEO & Accessibility Improvements:</strong> Footer buttons have been updated to
          native, search engine crawlable links, and sidebar selectors are fully accessible on
          mobile devices.
        </li>
      </ul>
      <h3>Getting Started Guidance</h3>
      <p>
        To get started, clone the repository, run the database container, validate your environment
        variables, and start the development server. For detailed instructions, see the{' '}
        <a href="/support/guides">Step-by-step Guides</a>.
      </p>

      <h2 id="upcoming">Upcoming Releases</h2>
      <p>Here is a preview of the features we are working on for the next release:</p>
      <ul>
        <li>
          <strong>Stripe & LemonSqueezy Payments Module:</strong> Ready-to-use hooks, secure
          webhooks processing, plans tables, and billing portal actions.
        </li>
        <li>
          <strong>Multi-Tenant Workspaces:</strong> Shared spaces, team invites, and role-based
          permissions validation.
        </li>
      </ul>
    </DocPage>
  )
}
