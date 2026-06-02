import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../_DocPage'

export const Route = createFileRoute('/_landing/_docs/product/integrations')({
  component: IntegrationsPage,
})

function IntegrationsPage() {
  const sections = [
    { id: 'principles', title: 'Integration Principles' },
    { id: 'categories', title: 'Common Categories' },
    { id: 'implementation', title: 'Implementation Notes' },
  ]

  const relatedLinks = [
    { label: 'Architecture Layers', to: '/starter/architecture' },
    { label: 'Roadmap & Future Modules', to: '/product/roadmap' },
  ]

  return (
    <DocPage
      title="Integrations"
      summary="Patterns meant to reduce risk early and keep consistency across products."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Third-party tools and APIs can speed up development, but adding too many external dependencies can create security risks, increase bundle size, and make maintenance more difficult. We follow strict patterns to integrate services cleanly.
      </p>

      <h2 id="principles">Integration Principles</h2>
      <p>
        When adding third-party integrations, keep these rules in mind:
      </p>
      <ul>
        <li>
          <strong>Environment-First Config:</strong> All API credentials, keys, and endpoint paths must be validated at startup through the central environment schema. Never hardcode strings in component files.
        </li>
        <li>
          <strong>Modular Wrappers:</strong> Wrap external clients in a local module or utility file (e.g. <code>src/shared/lib/analytics</code>) to isolate vendor-specific APIs. If you switch vendors later, you will only need to update this wrapper.
        </li>
        <li>
          <strong>Fail-Safe Code:</strong> Wrap API integrations in try/catch blocks to prevent external service downtime from breaking your core application.
        </li>
      </ul>

      <h2 id="categories">Common Categories</h2>
      <p>
        The edd Starter is pre-wired to support popular developer services:
      </p>
      <ul>
        <li>
          <strong>Authentication:</strong> Setup for Clerk/Better-Auth out-of-the-box. Provides page middleware and pre-configured callback endpoints.
        </li>
        <li>
          <strong>Database & Storage:</strong> Integrated with PostgreSQL databases via Drizzle ORM. Local storage adapters can be swapped for AWS S3, Cloudflare R2, or Supabase Storage.
        </li>
        <li>
          <strong>AI Models:</strong> Unified schemas to switch between cloud models (OpenAI, Anthropic) and local development models (Ollama, LM Studio).
        </li>
        <li>
          <strong>Payments (Upcoming):</strong> Structured billing handlers designed for Stripe and LemonSqueezy subscription setups.
        </li>
      </ul>

      <h2 id="implementation">Implementation Notes</h2>
      <p>
        To add a new integration (e.g., PostHog for analytics):
      </p>
      <ol>
        <li>
          Install the client library: <code>pnpm add posthog-js</code>.
        </li>
        <li>
          Define the environment variables in <code>.env</code> and add validation to your environment schema.
        </li>
        <li>
          Create a client provider file: <code>src/shared/lib/analytics.ts</code>.
        </li>
        <li>
          Wrap your root application component in the provider (located in <code>src/routes/-root-components.tsx</code>) to initialize the client.
        </li>
      </ol>
    </DocPage>
  )
}
