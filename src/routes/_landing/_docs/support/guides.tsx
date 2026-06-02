import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/support/guides')({
  component: GuidesPage,
})

function GuidesPage() {
  const sections = [
    { id: 'setup', title: 'Cloning & Setup' },
    { id: 'branding', title: 'Visual Customization' },
    { id: 'modules', title: 'Managing Modules' },
    { id: 'deploy', title: 'Deployment' },
  ]

  const relatedLinks = [
    { label: 'Documentation Index', to: '/support/documentation' },
    { label: 'Frequently Asked Questions', to: '/support/faq' },
  ]

  return (
    <DocPage
      title="Guides"
      summary="Step-by-step execution beats random setup every time."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Follow these step-by-step guides to get your application running locally and deployed to
        production.
      </p>

      <h2 id="setup">1. Cloning & Setup</h2>
      <p>Get the project running on your local development machine:</p>
      <ol>
        <li>
          <strong>Clone the repository:</strong>
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono">
            <code>git clone https://github.com/eddremonts86/edd-app-template.git my-app</code>
          </pre>
        </li>
        <li>
          <strong>Install dependencies:</strong> Make sure you have{' '}
          <a href="https://pnpm.io/" target="_blank" rel="noopener noreferrer">
            pnpm
          </a>{' '}
          installed.
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono">
            <code>pnpm install</code>
          </pre>
        </li>
        <li>
          <strong>Start the local database:</strong> Spin up the local PostgreSQL container.
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono">
            <code>pnpm db:up</code>
          </pre>
        </li>
        <li>
          <strong>Run database migrations:</strong> Create tables and seed initial database records.
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono">
            <code>pnpm db:migrate && pnpm db:seed:admin</code>
          </pre>
        </li>
        <li>
          <strong>Start the development server:</strong>
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono">
            <code>pnpm dev</code>
          </pre>
          Open{' '}
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
            http://localhost:3000
          </a>{' '}
          in your browser to verify the installation.
        </li>
      </ol>

      <h2 id="branding">2. Visual Customization</h2>
      <p>Update the branding to match your company or product identity:</p>
      <ul>
        <li>
          <strong>Theme Colors:</strong> Open <code>src/shared/styles/globals.css</code> and update
          the <code>--primary</code>, <code>--radius</code>, and <code>--background</code> values in
          the <code>:root</code> (light) and <code>.dark</code> (dark) blocks.
        </li>
        <li>
          <strong>Logos & Copy:</strong> Modify the landing page layouts and text located in{' '}
          <code>src/modules/landing/components/</code>.
        </li>
      </ul>

      <h2 id="modules">3. Managing Modules</h2>
      <p>Keep your codebase lean by disabling features you don't need:</p>
      <ul>
        <li>
          To disable the local AI integrations, remove the AI modules imports in your page layouts
          and remove the corresponding routes from your route directory.
        </li>
        <li>
          Ensure you maintain strict <a href="/starter/conventions">module boundaries</a> to prevent
          changes in one area from breaking other parts of your app.
        </li>
      </ul>

      <h2 id="deploy">4. Deployment</h2>
      <p>When you are ready to publish your application to production:</p>
      <ol>
        <li>
          Configure your production environment variables (database credentials, Clerk API keys,
          Sentry endpoints) in your hosting dashboard.
        </li>
        <li>
          Ensure database migrations run automatically during deployment by adding the migration
          step to your build commands or release phases:
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono">
            <code>pnpm db:migrate</code>
          </pre>
        </li>
        <li>
          Build your production assets and start the application server:
          <pre className="p-3 rounded-lg bg-muted text-xs font-mono">
            <code>pnpm build && pnpm preview</code>
          </pre>
        </li>
      </ol>
    </DocPage>
  )
}
