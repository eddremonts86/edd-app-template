import { createFileRoute } from '@tanstack/react-router'
import { DocPage } from '../-_DocPage'

export const Route = createFileRoute('/_landing/_docs/starter/design-tokens')({
  component: DesignTokensPage,
})

function DesignTokensPage() {
  const sections = [
    { id: 'oklch-colors', title: 'OKLCH Color Variables' },
    { id: 'fonts', title: 'Font Stack Configuration' },
    { id: 'radii-shadows', title: 'Radii & Custom Shadows' },
    { id: 'theme-customization', title: 'Theme Switcher Logic' },
  ]

  const relatedLinks = [
    { label: 'Module Map details', to: '/starter/module-map' },
    { label: 'Codebase Conventions', to: '/starter/conventions' },
  ]

  return (
    <DocPage
      title="Design Tokens"
      summary="Make branding changes fast and keep UI consistent across products."
      sections={sections}
      relatedLinks={relatedLinks}
    >
      <p>
        Design tokens are the foundational visual values of our design system. We define them as CSS
        variables inside <code>src/shared/styles/globals.css</code>, allowing you to update your
        brand's colors, fonts, margins, and borders from a single file.
      </p>

      <h2 id="oklch-colors">OKLCH Color Variables</h2>
      <p>
        The template uses the <strong>OKLCH</strong> color model. OKLCH is a modern color space that
        provides consistent perceived brightness across different hues. This makes it easier to
        maintain accessibility and contrast ratios when switching between light and dark modes.
      </p>

      <table className="min-w-full divide-y divide-border/40">
        <thead>
          <tr>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
              Variable
            </th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
              Light Theme Value
            </th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
              Dark Theme Value
            </th>
            <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
              Usage Context
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          <tr>
            <td className="py-2 font-mono text-xs">--background</td>
            <td className="py-2 font-mono text-xs">oklch(1 0 0)</td>
            <td className="py-2 font-mono text-xs">oklch(0.14 0 0)</td>
            <td className="py-2">Base app background</td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">--foreground</td>
            <td className="py-2 font-mono text-xs">oklch(0.14 0 0)</td>
            <td className="py-2 font-mono text-xs">oklch(0.99 0 0)</td>
            <td className="py-2">Primary body text</td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">--primary</td>
            <td className="py-2 font-mono text-xs">oklch(0.2 0 0)</td>
            <td className="py-2 font-mono text-xs">oklch(0.92 0 0)</td>
            <td className="py-2">Buttons, active tags, highlights</td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">--card</td>
            <td className="py-2 font-mono text-xs">oklch(1 0 0)</td>
            <td className="py-2 font-mono text-xs">oklch(0.2 0 0)</td>
            <td className="py-2">Dashboard widgets, cards</td>
          </tr>
          <tr>
            <td className="py-2 font-mono text-xs">--border</td>
            <td className="py-2 font-mono text-xs">oklch(0.92 0 0)</td>
            <td className="py-2 font-mono text-xs">oklch(1 0 0 / 10%)</td>
            <td className="py-2">Layout dividing borders</td>
          </tr>
        </tbody>
      </table>

      <h2 id="fonts">Font Stack Configuration</h2>
      <p>
        We use system font stacks to ensure fast loading times and a consistent native feel across
        operating systems:
      </p>
      <ul>
        <li>
          <strong>Sans (Interface Text):</strong> Mapped to <code>Geist</code>, with Apple and Segoe
          UI system fonts as fallbacks.
        </li>
        <li>
          <strong>Mono (Data & Code):</strong> Standardized on <code>Geist Mono</code> for code
          blocks, telemetry logs, and financial tables.
        </li>
      </ul>

      <h2 id="radii-shadows">Radii & Custom Shadows</h2>
      <p>The border radius scales dynamically to keep layout elements consistent:</p>
      <ul>
        <li>
          <strong>
            Border Radius (<code>--radius</code>):
          </strong>{' '}
          Set to a default of <code>0.625rem</code> (10px). Inner elements adjust automatically
          (e.g. <code>--radius-sm</code> resolves to <code>var(--radius) - 4px</code>).
        </li>
        <li>
          <strong>Box Shadows:</strong> Preconfigured with elevation scales from{' '}
          <code>shadow-xs</code> (1px offset) up to <code>shadow-2xl</code> (for dialog containers).
        </li>
      </ul>

      <h2 id="theme-customization">Theme Switcher Logic</h2>
      <p>
        We support system preference detection and manual theme overrides using{' '}
        <code>next-themes</code>. To customize your brand's appearance:
      </p>
      <ol>
        <li>
          Update the color coordinates in <code>src/shared/styles/globals.css</code>.
        </li>
        <li>
          Avoid using hardcoded hex values in your components. Instead, rely on tailwind classes
          that consume these tokens (e.g. <code>bg-primary</code> or <code>border-border</code>).
        </li>
      </ol>
    </DocPage>
  )
}
