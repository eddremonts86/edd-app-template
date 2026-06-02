import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/product/changelog')({
  component: ChangelogPage,
})

function ChangelogPage() {
  const sections = [
    { id: 'v011', title: 'v0.1.1 — Documentation & Access' },
    { id: 'v010', title: 'v0.1.0 — Kernel Launch' },
    { id: 'standards', title: 'Formatting Guidelines' },
  ]

  const relatedLinks = [
    { label: 'Release Notes Narrative', to: '/product/release-notes' },
    { label: 'Product Roadmap', to: '/product/roadmap' },
  ]

  return (
    <DocPage
      title="Changelog"
      summary="Versioned updates focusing on what changed and why."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Keep track of new features, bug fixes, performance optimizations, and security updates in
        the edd Starter template.
      </p>

      <h2 id="v011">v0.1.1 (June 2026)</h2>
      <p>
        This release introduces the documentation routing layouts, sidebar panels, and accessibility
        fixes:
      </p>
      <h3>Added</h3>
      <ul>
        <li>
          <strong>Documentation Layout:</strong> Added a responsive, pathless sidebar layout (
          <code>_docs.tsx</code>) that sticky-positions navigation on desktop and collapses into a
          menu drawer on mobile.
        </li>
        <li>
          <strong>
            Standardized Page Layout (<code>_DocPage.tsx</code>):
          </strong>{' '}
          Added a reusable documentation component that supports anchor index arrays, headers, and
          related link footers.
        </li>
      </ul>
      <h3>Improved</h3>
      <ul>
        <li>
          <strong>Accessible Navigation Links:</strong> Updated footer buttons to native, search
          engine crawlable <code>&lt;Link&gt;</code> tags.
        </li>
        <li>
          <strong>Code Quality:</strong> Resolved ESLint issues (type checking, imports ordering,
          explicit any types) across layouts and routing directories.
        </li>
      </ul>

      <h2 id="v010">v0.1.0 (June 2026)</h2>
      <p>Initial release of the template.</p>
      <h3>Added</h3>
      <ul>
        <li>
          <strong>Core Modular Engine:</strong> Added the module registry system (
          <code>src/modules/core/</code>) to dynamically load routes and navigation manifests.
        </li>
        <li>
          <strong>Unified AI Workspace:</strong> Added adapters to switch between local LLMs
          (Ollama, LM Studio) and cloud APIs (OpenAI, Anthropic).
        </li>
        <li>
          <strong>Database Client:</strong> Pre-wired connection configuration templates for
          PostgreSQL using Drizzle ORM.
        </li>
      </ul>

      <h2 id="standards">Formatting Guidelines</h2>
      <p>When adding entries to the changelog, follow these formatting guidelines:</p>
      <ol>
        <li>
          Group entries under clear categories: <code>Added</code> (for new features),{' '}
          <code>Improved</code> (for optimizations or refactoring), or <code>Fixed</code> (for bug
          fixes).
        </li>
        <li>List all changed files and directories to keep the history clear.</li>
        <li>Explain the reason behind changes to help contributors understand the updates.</li>
      </ol>
    </DocPage>
  )
}
