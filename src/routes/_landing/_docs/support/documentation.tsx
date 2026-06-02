import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../_DocPage'

export const Route = createFileRoute('/_landing/_docs/support/documentation')({
  component: SupportDocumentationPage,
})

function SupportDocumentationPage() {
  const sections = [
    { id: 'path', title: 'Recommended Path' },
    { id: 'model', title: 'Support Model' },
    { id: 'contact', title: 'Contact Support' },
  ]

  const relatedLinks = [
    { label: 'Step-by-step Guides', to: '/support/guides' },
    { label: 'Frequently Asked Questions', to: '/support/faq' },
  ]

  return (
    <DocPage
      title="Documentation Guide"
      summary="Your map from clone → production-ready product."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Welcome to the support documentation directory. This section helps you set up, customize, test, and deploy your SaaS application using the edd Starter template.
      </p>

      <h2 id="path">Recommended Path</h2>
      <p>
        To get the most out of the template, we recommend following these steps:
      </p>
      <ol>
        <li>
          <strong>Understand the Foundation:</strong> Read the <a href="/starter/architecture">Architecture</a> and <a href="/starter/module-map">Module Map</a> pages to learn how the codebase is structured.
        </li>
        <li>
          <strong>Set Up Your Brand:</strong> Follow the <a href="/starter/design-tokens">Design Tokens</a> guide to update colors, typography, and logos.
        </li>
        <li>
          <strong>Deploy to Production:</strong> Go through the checklist in the <a href="/support/guides">Step-by-step Guides</a> to deploy your application to hosting platforms.
        </li>
      </ol>

      <h2 id="model">Support Model</h2>
      <p>
        We offer asynchronous support channels to help you troubleshoot issues:
      </p>
      <ul>
        <li>
          <strong>Community Forum & GitHub Issues:</strong> Best for general questions, bug reports, and feature requests. Our team and community review these channels daily.
        </li>
        <li>
          <strong>Onboarding Slack / Discord Channels:</strong> Direct access to core maintainers during your onboarding period.
        </li>
        <li>
          <strong>Support SLAs:</strong> We aim to respond to issues within 24 to 48 hours on business days.
        </li>
      </ul>

      <h2 id="contact">Contact Support</h2>
      <p>
        If you need direct assistance with onboarding, custom integrations, or architecture consulting, email us at:
      </p>
      <pre className="p-4 rounded-xl bg-muted/80 border border-border/40 overflow-x-auto text-xs md:text-sm font-mono mt-4">
        <code>support@eddremonts.com</code>
      </pre>
      <p>
        Please include your project name, a short description of the issue, and any relevant logs or error details.
      </p>
    </DocPage>
  )
}
