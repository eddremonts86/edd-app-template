import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/legal/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  const sections = [
    { id: 'data-collection', title: 'Data We Collect' },
    { id: 'data-usage', title: 'How We Use Data' },
    { id: 'open-source', title: 'Open-Source Disclaimer' },
  ]

  const relatedLinks = [
    { label: 'Terms of Use', to: '/legal/terms' },
    { label: 'Cookies Statement', to: '/legal/cookies' },
  ]

  return (
    <DocPage
      title="Privacy Policy"
      summary="How we handle data in the project context."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        This privacy policy describes how we collect, use, and protect your information when you use
        our application.
      </p>

      <h2 id="data-collection">Data We Collect</h2>
      <p>Depending on how you use our application, we may collect the following information:</p>
      <ul>
        <li>
          <strong>Account Information:</strong> If you register for an account, we collect your
          email address, name, and profile credentials.
        </li>
        <li>
          <strong>Usage Statistics:</strong> We collect anonymized usage details (such as page
          views, action clicks, and device types) to help us improve the application.
        </li>
      </ul>

      <h2 id="data-usage">How We Use Data</h2>
      <p>We use the collected information for the following purposes:</p>
      <ul>
        <li>To provide, maintain, and support the application.</li>
        <li>To notify you about updates, releases, and security advisories.</li>
        <li>To analyze and optimize application performance and user experience.</li>
      </ul>

      <h2 id="open-source">Open-Source Disclaimer</h2>
      <p>
        This application template is open-source. When you deploy your own instance of this
        template, you are responsible for configuring its database settings, authentication
        providers, and privacy controls to comply with local regulations (such as GDPR or CCPA).
      </p>
    </DocPage>
  )
}
