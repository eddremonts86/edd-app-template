import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../_DocPage'

export const Route = createFileRoute('/_landing/_docs/legal/licenses')({
  component: LicensesPage,
})

function LicensesPage() {
  const sections = [
    { id: 'project-license', title: 'Project License' },
    { id: 'dependencies', title: 'Dependency Overview' },
  ]

  const relatedLinks = [
    { label: 'Terms of Use', to: '/legal/terms' },
    { label: 'Privacy Policy', to: '/legal/privacy' },
  ]

  return (
    <DocPage
      title="Licenses"
      summary="Open-source licensing overview and dependencies."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        edd Starter is built using open-source software. This page provides details on the licenses governing this template and its primary dependencies.
      </p>

      <h2 id="project-license">Project License</h2>
      <p>
        The edd Starter template is released under the MIT License:
      </p>
      <pre className="p-4 rounded-xl bg-muted/80 border border-border/40 overflow-x-auto text-xs md:text-sm font-mono mt-4 leading-relaxed">
        {`Copyright (c) 2026 eddremonts

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
      </pre>

      <h2 id="dependencies">Dependency Overview</h2>
      <p>
        Our core dependencies are licensed under open-source terms:
      </p>
      <ul>
        <li><strong>React & React DOM:</strong> MIT License</li>
        <li><strong>TanStack Router, Start, Form, and Query:</strong> MIT License</li>
        <li><strong>Tailwind CSS:</strong> MIT License</li>
        <li><strong>Lucide Icons:</strong> ISC License</li>
        <li><strong>Drizzle ORM:</strong> Apache 2.0 License</li>
      </ul>
      <p>
        Before distributing your application, make sure to review the licenses of any additional packages you install.
      </p>
    </DocPage>
  )
}
