import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../_DocPage'

export const Route = createFileRoute('/_landing/_docs/legal/terms')({
  component: TermsPage,
})

function TermsPage() {
  const sections = [
    { id: 'usage-terms', title: 'Open-Source Usage' },
    { id: 'liability', title: 'Limitations of Liability' },
  ]

  const relatedLinks = [
    { label: 'Privacy Policy', to: '/legal/privacy' },
    { label: 'Package Licenses', to: '/legal/licenses' },
  ]

  return (
    <DocPage
      title="Terms of Use"
      summary="Usage terms and limitations."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Please read these terms of use carefully before using this application template.
      </p>

      <h2 id="usage-terms">Open-Source Usage</h2>
      <p>
        This application template is provided as open-source software under the MIT License. You are free to copy, modify, distribute, and use the code for both commercial and non-commercial purposes, subject to the conditions of the license.
      </p>

      <h2 id="liability">Limitations of Liability</h2>
      <p>
        The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
      </p>
      <p>
        In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.
      </p>
    </DocPage>
  )
}
