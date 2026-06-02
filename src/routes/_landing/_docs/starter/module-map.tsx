import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/starter/module-map')({
  component: ModuleMapPage,
})

function ModuleMapPage() {
  const sections = [
    { id: 'registry', title: 'Registry Mechanism' },
    { id: 'module-catalog', title: 'Codebase Modules Catalog' },
    { id: 'manifest', title: 'Manifest Syntax' },
    { id: 'resolution', title: 'Module Resolution Flow' },
  ]

  const relatedLinks = [
    { label: 'Architecture Overview', to: '/starter/architecture' },
    { label: 'Development Conventions', to: '/starter/conventions' },
  ]

  return (
    <DocPage
      title="Module Map"
      summary="Included blocks and where they fit in the base architecture."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        The codebase is organized into self-contained modules located under{' '}
        <code>src/modules/*</code>. This modular setup makes it easy to add new features or remove
        unused modules.
      </p>

      <h2 id="registry">Registry Mechanism</h2>
      <p>
        Modules register with the application by exposing an <code>AppModuleManifest</code> object.
        This manifest defines their routes, navigation structure, dependencies, and widget
        components. The core kernel (<code>src/modules/core</code>) reads these manifests to
        dynamically configure layouts, sidebars, and widgets.
      </p>

      <h2 id="module-catalog">Codebase Modules Catalog</h2>
      <p>The following modules are built into the template:</p>
      <table className="min-w-full divide-y divide-border/40">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
              Module ID
            </th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
              Purpose
            </th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
              Features Included
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          <tr>
            <td className="py-2 font-mono text-xs">landing</td>
            <td className="py-2">Marketing & Conversion</td>
            <td className="py-2">
              Glowy wave hero, comparison tables, interactive rollout checklists
            </td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">auth</td>
            <td className="py-2">Access Control</td>
            <td className="py-2">
              Multi-tenant session validation, Clerk SSO integrations, route middleware
            </td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">dashboard</td>
            <td className="py-2">Product Core</td>
            <td className="py-2">Telemetry graphs, database query lists, transactions overview</td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">ai</td>
            <td className="py-2">Cognitive Operations</td>
            <td className="py-2">
              Local models (Ollama, LM Studio), cloud models (OpenAI, Anthropic), audit logs
            </td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">users</td>
            <td className="py-2">Directory & Profiles</td>
            <td className="py-2">Role management (admin, member), edit forms, activity logs</td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">settings</td>
            <td className="py-2">System Config</td>
            <td className="py-2">Visual layout controls, developer toggle visibility settings</td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">help</td>
            <td className="py-2">Support Interface</td>
            <td className="py-2">Interactive diagnostic logs, connection testing helpers</td>
          </tr>
        </tbody>
      </table>

      <h2 id="manifest">Manifest Syntax</h2>
      <p>
        Each module declares its configuration in a <code>manifest.ts</code> file. For example:
      </p>
      <pre className="p-4 rounded-xl bg-muted/80 border border-border/40 overflow-x-auto text-xs md:text-sm font-mono">
        <code>{`import { IconSearch } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const aiModule: AppModuleManifest = {
  id: 'ai',
  title: 'AI Workspace',
  description: 'Local and cloud provider AI models.',
  routes: [
    { path: '/api/ai/chat', kind: 'api' },
    { path: '/api/ai/search', kind: 'api' }
  ],
  navigation: [
    {
      id: 'core',
      title: 'Core',
      kind: 'main',
      order: 10,
      items: [
        {
          id: 'ai-search',
          titleKey: 'sidebar.secondary.search',
          fallbackTitle: 'Search',
          icon: IconSearch,
          order: 10
        }
      ]
    }
  ]
}`}</code>
      </pre>

      <h2 id="resolution">Module Resolution Flow</h2>
      <p>
        The diagram below shows how the application resolves dependencies and loads modules
        dynamically:
      </p>

      {/* Mermaid diagram */}
      <pre className="mermaid p-4 rounded-xl bg-muted/40 border border-border/30 overflow-x-auto text-xs">
        {`graph TD
  EnvVars[VITE_ENABLED_MODULES] --> CoreReg[core/registry.ts]
  CoreReg --> LoadManifests[Load Module Manifests]
  LoadManifests --> ResolveDeps[Resolve Dependencies]
  ResolveDeps --> FilterDisabled[Filter Out Disabled Modules]
  FilterDisabled --> GenerateRoutes[Compile Route Map]
  FilterDisabled --> GenerateSidebar[Construct Sidebar Navigation]`}
      </pre>
    </DocPage>
  )
}
