import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/support/faq')({
  component: FAQPage,
})

function FAQPage() {
  const sections = [
    { id: 'purpose', title: 'What is edd Starter for?' },
    { id: 'modules-selection', title: 'Can I pick only some modules?' },
    { id: 'setup-duration', title: 'How long does setup take?' },
    { id: 'support-inclusion', title: 'What support is included?' },
    { id: 'open-source-license', title: 'Is this open-source?' },
  ]

  const relatedLinks = [
    { label: 'Architecture Overview', to: '/starter/architecture' },
    { label: 'Step-by-step Guides', to: '/support/guides' },
  ]

  return (
    <DocPage
      title="FAQ"
      summary="Quick answers to common questions."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Here are answers to the most common questions about the edd Starter template. If you have a
        question that isn't answered here, please search our GitHub issues or reach out through our
        support channels.
      </p>

      <h2 id="purpose">What is edd Starter for?</h2>
      <p>
        edd Starter is a boilerplate designed to help developers build and deploy SaaS applications,
        landing pages, and internal tools quickly. It provides reliable defaults, structured modular
        directories, and type-safe routing out-of-the-box.
      </p>

      <h2 id="modules-selection">Can I pick only some modules?</h2>
      <p>
        Yes. The template uses a modular design so that features are isolated. If your minimum
        viable product (MVP) doesn't require certain modules (like AI integrations or advanced
        charts), you can remove those directories and their routes without breaking the rest of your
        application.
      </p>

      <h2 id="setup-duration">How long does setup take?</h2>
      <p>
        Setting up the template takes less than 10 minutes. Once you clone the repository, install
        dependencies, and start your database container, you will have a fully functioning local
        application shell ready for customization.
      </p>

      <h2 id="support-inclusion">What support is included?</h2>
      <p>
        We offer asynchronous support channels, including GitHub issues and email support. We aim to
        respond to inquiries within 24 to 48 hours on business days.
      </p>

      <h2 id="open-source-license">Is this open-source?</h2>
      <p>
        Yes, edd Starter is open-source software licensed under the MIT License. You can use it for
        both personal and commercial projects.
      </p>
    </DocPage>
  )
}
