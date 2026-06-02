import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../_DocPage'

export const Route = createFileRoute('/_landing/_docs/starter/architecture')({
  component: ArchitecturePage,
})

function ArchitecturePage() {
  const sections = [
    { id: 'layers', title: 'System Layers' },
    { id: 'routing', title: 'Routing & SSR' },
    { id: 'module-boundaries', title: 'Module Isolation Rules' },
    { id: 'data-flows', title: 'Data Synchronization Flow' },
    { id: 'visual-map', title: 'Architectural Layer Map' },
  ]

  const relatedLinks = [
    { label: 'Module Map Details', to: '/starter/module-map' },
    { label: 'Codebase Conventions', to: '/starter/conventions' },
  ]

  return (
    <DocPage
      title="Architecture"
      summary="A modular, production-first baseline with clear boundaries and safe defaults."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        The edd Starter template uses a structured, modular architecture. It moves away from generic, unorganized boilerplate folders and instead groups files by vertical product capabilities. This keeps features separated, prevents circular imports, and allows you to scale the codebase easily.
      </p>

      <h2 id="layers">System Layers</h2>
      <p>
        The application is divided into three layers to keep technical infrastructure separate from business logic:
      </p>
      <ul>
        <li>
          <strong>App Shell & Routing:</strong> Handles top-level page routing, global layout shells, authentication route guards, and theme settings.
        </li>
        <li>
          <strong>Domain Modules (<code>src/modules/*</code>):</strong> Decoupled folders representing specific business capabilities (e.g. <code>modules/ai</code> for assistant actions, <code>modules/auth</code> for credentials). Each module encapsulates its own views, server actions, config, and state schemas.
        </li>
        <li>
          <strong>Shared Layer (<code>src/shared/*</code>):</strong> Cross-cutting services and helpers that don't contain business logic, such as the database client, validation frameworks, Sentry configs, and generic UI components.
        </li>
      </ul>

      <h2 id="routing">Routing & SSR</h2>
      <p>
        We use <strong>TanStack Start & TanStack Router</strong> for 100% type-safe, file-based routing. This includes server-side rendering (SSR), hydration management, and search parameter validation:
      </p>
      <ul>
        <li>
          <strong>Pathless Routing:</strong> Folders prefixed with an underscore (like <code>_landing</code> or <code>_docs</code>) group pages sharing identical visual shells without changing the URL path.
        </li>
        <li>
          <strong>Server Actions & Hydration:</strong> Data fetch operations are handled in route loaders, meaning page data is fetched on the server and hydrated on the client with full type safety.
        </li>
      </ul>

      <h2 id="module-boundaries">Module Isolation Rules</h2>
      <p>
        To prevent the codebase from becoming difficult to maintain, modules must follow strict boundaries:
      </p>
      
      <div className="p-4 rounded-xl border border-warning/45 bg-warning/5 my-4">
        <p className="font-bold text-warning-foreground text-sm m-0">
          ⚠️ Crucial Convention: Zero Cross-Module Imports
        </p>
        <p className="text-xs text-muted-foreground mt-1 m-0">
          Files inside <code>src/modules/ai/</code> must never import from <code>src/modules/auth/</code>.
          If two modules need to share a capability, that capability must be promoted to a shared module under <code>src/modules/shared/</code> or moved into the <code>src/shared/</code> layer.
        </p>
      </div>

      <h2 id="data-flows">Data Synchronization Flow</h2>
      <p>
        The application coordinates client-side state with server database models using a clear data flow:
      </p>
      <ol>
        <li>
          <strong>Route loaders</strong> fetch the initial data on the server during requests.
        </li>
        <li>
          <strong>React Hook Form</strong> handles user input validation using schemas defined with <strong>Zod</strong>.
        </li>
        <li>
          <strong>TanStack Query</strong> triggers mutations, validates data, updates cache layers, and manages optimistic UI states on the client.
        </li>
      </ol>

      <h2 id="visual-map">Architectural Layer Map</h2>
      <p>
        The diagram below shows how requests flow through the application, moving from client views down to domain modules and shared utilities:
      </p>
      
      <div className="not-prose my-6 rounded-2xl overflow-hidden border border-border/40 shadow-md">
        <img 
          src="/flat_modular_architecture.png" 
          alt="Modular Software Architecture Layers Diagram" 
          className="w-full object-cover"
        />
        <div className="bg-muted/40 px-4 py-2 border-t border-border/30 text-center">
          <span className="text-xs text-muted-foreground font-medium">Modular Architecture Layer Map</span>
        </div>
      </div>
    </DocPage>
  )
}
