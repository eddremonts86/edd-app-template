import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../_DocPage'

export const Route = createFileRoute('/_landing/_docs/support/examples')({
  component: ExamplesPage,
})

function ExamplesPage() {
  const sections = [
    { id: 'saas-skeleton', title: 'SaaS Skeleton' },
    { id: 'visual-preview', title: 'Dashboard UI Interface' },
    { id: 'landing-layouts', title: 'Landing Layouts' },
    { id: 'internal-tools', title: 'Internal Tools' },
  ]

  const relatedLinks = [
    { label: 'Step-by-step Guides', to: '/support/guides' },
    { label: 'Frequently Asked Questions', to: '/support/faq' },
  ]

  return (
    <DocPage
      title="Examples"
      summary="Reference implementations to model your product after."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        These reference implementations show how to use the edd Starter template to build different types of web applications.
      </p>

      <h2 id="saas-skeleton">SaaS Skeleton</h2>
      <p>
        A complete boilerplate layout for subscription-based SaaS applications:
      </p>
      <ul>
        <li>
          <strong>Auth Integration:</strong> Protected dashboard directories under <code>src/routes/_dashboard/</code> that verify sessions before loading pages.
        </li>
        <li>
          <strong>Data Tables:</strong> Pre-designed tables in the billing sections showing invoice lists, subscription statuses, and user activity logs.
        </li>
        <li>
          <strong>Stripe Integration:</strong> Example routes showing how to handle checkout redirection and capture billing events.
        </li>
      </ul>

      <h2 id="visual-preview">Dashboard UI Interface</h2>
      <p>
        Below is a visual preview of a dashboard built with the template:
      </p>

      <div className="not-prose my-6 rounded-2xl overflow-hidden border border-border/40 shadow-md">
        <img 
          src="/clean_dashboard_mockup.png" 
          alt="SaaS Telemetry Dashboard Interface Mockup" 
          className="w-full object-cover"
        />
        <div className="bg-muted/40 px-4 py-2 border-t border-border/30 text-center">
          <span className="text-xs text-muted-foreground font-medium">SaaS Telemetry Dashboard Interface Mockup</span>
        </div>
      </div>

      <h2 id="landing-layouts">Landing Layouts</h2>
      <p>
        A collection of landing page designs optimized for conversion and speed:
      </p>
      <ul>
        <li>
          <strong>Hero Blocks:</strong> Eye-catching headers with calls-to-action (CTAs) and interactive command line blocks.
        </li>
        <li>
          <strong>Pricing Grids:</strong> Responsive pricing cards with toggle buttons to switch between monthly and annual billing plans.
        </li>
        <li>
          <strong>Feedback Timelines:</strong> Dynamic lists to display customer reviews, testimonials, and brand logos.
        </li>
      </ul>

      <h2 id="internal-tools">Internal Tools</h2>
      <p>
        Scaffolding for administrative tools, support dashboards, and database viewers:
      </p>
      <ul>
        <li>
          <strong>Data Fetching & Search:</strong> Search layouts with input validation, filters, and paginated lists.
        </li>
        <li>
          <strong>Role Checks:</strong> Page guards that restrict administrative settings to users with designated roles.
        </li>
      </ul>
    </DocPage>
  )
}
