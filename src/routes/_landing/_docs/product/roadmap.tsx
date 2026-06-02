import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/product/roadmap')({
  component: RoadmapPage,
})

function RoadmapPage() {
  const sections = [
    { id: 'near-term', title: 'Near-Term: Q2 2026' },
    { id: 'mid-term', title: 'Mid-Term: Q3 2026' },
    { id: 'long-term', title: 'Long-Term: Q4 2026' },
    { id: 'contributing', title: 'Contributing' },
  ]

  const relatedLinks = [
    { label: 'Changelog History', to: '/product/changelog' },
    { label: 'Integration Matrix', to: '/product/integrations' },
  ]

  return (
    <DocPage
      title="Roadmap"
      summary="A living plan focused on shipping speed and sustainable foundations."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        The edd Starter roadmap focuses on developer velocity, visual feedback, and reliable
        production foundations. Rather than chasing every trending library, we focus on providing a
        stable platform for launching SaaS MVPs.
      </p>

      <h2 id="near-term">Near-Term: Q2 2026</h2>
      <p>
        <strong>Focus: Visual Telemetry, AI Extensions, and Route Hydration Optimization</strong>
      </p>
      <ul>
        <li>
          <strong>AI Providers Adapter:</strong> Complete the provider adapters to support OpenAI,
          Anthropic, and local models (Ollama, LM Studio) out-of-the-box.
        </li>
        <li>
          <strong>Sentry Logging Integrations:</strong> Configure automated error tracking across
          layouts, loaders, and server actions.
        </li>
        <li>
          <strong>Landing Page Blocks:</strong> Add comparison tables and checklist widgets directly
          into the core landing layout.
        </li>
      </ul>

      <h2 id="mid-term">Mid-Term: Q3 2026</h2>
      <p>
        <strong>Focus: Payments Module, Billing Portal, and Workspace Management</strong>
      </p>
      <ul>
        <li>
          <strong>Billing Adapter:</strong> Implement ready-to-use billing configurations for Stripe
          and LemonSqueezy, including checkout redirect flows and secure webhook validators.
        </li>
        <li>
          <strong>Workspace Organizations:</strong> Support workspace switching, role-based invites
          (admin, member), and tenant-level configurations.
        </li>
        <li>
          <strong>CLI Bootstrapper:</strong> Build a CLI tool (e.g. <code>npx create-edd-app</code>)
          to scaffold new modules and configure routes automatically.
        </li>
      </ul>

      <h2 id="long-term">Long-Term: Q4 2026</h2>
      <p>
        <strong>Focus: Performance Audits, Edge Rendering, and Native App Shells</strong>
      </p>
      <ul>
        <li>
          <strong>Edge-Ready Database Adapters:</strong> Swap database connections to edge-ready
          pools (like Neon or Supabase connection pooling).
        </li>
        <li>
          <strong>Telemetry Diagnostics:</strong> Include standard dashboards for measuring response
          latency and monitoring API usage metrics.
        </li>
      </ul>

      <h2 id="contributing">Contributing</h2>
      <p>edd Starter is open source. If you want to contribute:</p>
      <ol>
        <li>Browse our active issues on GitHub or suggest an architecture improvement.</li>
        <li>
          Before starting work on a pull request, create a GitHub issue to align with the core
          maintainers on the implementation path.
        </li>
        <li>
          Ensure your changes pass type-checks, linter checks, and automated Vitest/Playwright tests
          before submitting.
        </li>
      </ol>
    </DocPage>
  )
}
