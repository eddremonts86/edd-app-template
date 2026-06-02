import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../_DocPage'

export const Route = createFileRoute('/_landing/_docs/starter/conventions')({
  component: ConventionsPage,
})

function ConventionsPage() {
  const sections = [
    { id: 'module-boundaries', title: 'Vertical Module Boundaries' },
    { id: 'env-validation', title: 'Environment Config & Safety' },
    { id: 'routing', title: 'Route Colocation Rules' },
    { id: 'testing', title: 'Testing Conventions' },
  ]

  const relatedLinks = [
    { label: 'Architecture Overview', to: '/starter/architecture' },
    { label: 'Module Map Details', to: '/starter/module-map' },
  ]

  return (
    <DocPage
      title="Conventions"
      summary="Keep teams aligned and apps maintainable across the starter ecosystem."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Consistency helps teams ship code faster and keep maintenance costs low. By following strict code conventions, we keep code simple and make onboarding easy for new developers.
      </p>

      <h2 id="module-boundaries">Vertical Module Boundaries</h2>
      <p>
        The most important rule in this template is the separation of business modules:
      </p>
      <ul>
        <li>
          <strong>Domain Colocation:</strong> Store UI components, server actions, settings, and business logic inside the module directory (e.g. <code>src/modules/ai/</code>).
        </li>
        <li>
          <strong>No Cross-Module Imports:</strong> Code inside <code>src/modules/ai/</code> must not import directly from <code>src/modules/auth/</code>.
        </li>
        <li>
          <strong>Shared Promotion:</strong> If code is needed by multiple modules, move it to <code>src/modules/shared/</code> or promote it to a generic utility inside the <code>src/shared/</code> layer.
        </li>
      </ul>

      {/* Mermaid boundary diagram */}
      <pre className="mermaid p-4 rounded-xl bg-muted/40 border border-border/30 overflow-x-auto text-xs">
        {`graph LR
  subgraph Modules Layer
    AI[modules/ai]
    Auth[modules/auth]
    SharedMod[modules/shared]
  end
  subgraph Shared Core
    Tech[src/shared]
  end
  AI --> SharedMod
  Auth --> SharedMod
  AI -.-> |FORBIDDEN DIRECT IMPORT| Auth
  AI --> Tech
  Auth --> Tech`}
      </pre>

      <h2 id="env-validation">Environment Config & Safety</h2>
      <p>
        To prevent runtime errors, never call <code>process.env</code> or <code>import.meta.env</code> directly in your components. Instead, validate all environment configurations at startup:
      </p>
      <pre className="p-4 rounded-xl bg-muted/80 border border-border/40 overflow-x-auto text-xs md:text-sm font-mono">
        <code>{`import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  VITE_ENABLED_MODULES: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'anthropic', 'ollama']).default('ollama')
})

export const env = envSchema.parse(import.meta.env)`}</code>
      </pre>

      <h2 id="routing">Route Colocation Rules</h2>
      <p>
        We use TanStack Router for file-based routing. Keep route files thin and delegate layout rendering to components inside your module directories:
      </p>
      <ol>
        <li>
          Define routes under <code>src/routes/</code>.
        </li>
        <li>
          Import the page view or layout component from your module directory.
        </li>
        <li>
          Avoid writing complex UI code directly inside the route files.
        </li>
      </ol>

      <h2 id="testing">Testing Conventions</h2>
      <p>
        We run automated tests to maintain type safety and application reliability:
      </p>
      <ul>
        <li>
          <strong>Unit & Component Tests:</strong> Run with <strong>Vitest</strong> (<code>pnpm test:unit</code>). Keep test files colocated with their target component using the <code>.spec.ts</code> suffix.
        </li>
        <li>
          <strong>E2E Browser Tests:</strong> Run with <strong>Playwright</strong> (<code>pnpm test:e2e</code>). Store these tests under <code>tests/e2e/</code> to test user authentication and AI generation flows.
        </li>
      </ul>
    </DocPage>
  )
}
