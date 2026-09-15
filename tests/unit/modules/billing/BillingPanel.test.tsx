import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import dk from '@/modules/billing/i18n/dk.json'
import en from '@/modules/billing/i18n/en.json'
import es from '@/modules/billing/i18n/es.json'

/**
 * The panel used to throw the failure away: `createPortalLinkFn` reports a
 * refusal as `{ error: code }` rather than throwing, so it arrived in
 * `onSuccess` and nothing read it. The button did nothing and the only thing
 * left to try was pressing it again.
 *
 * `t` here reads the real catalogue rather than echoing the key, because the
 * lookup is built from a template literal — `billing.error.${code}` — which the
 * i18n gate cannot resolve statically. A missing string would otherwise pass
 * every check we have.
 */

function translate(key: string, options?: { defaultValue?: string }): string {
  let node: unknown = en
  for (const segment of key.replace(/^billing\./, '').split('.')) {
    node = (node as Record<string, unknown> | undefined)?.[segment]
  }
  return typeof node === 'string' ? node : (options?.defaultValue ?? key)
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: translate }),
}))

vi.mock('@/modules', () => ({ useCapability: () => ({ isConfigured: true }) }))

const createPortalLinkFn = vi.fn()

vi.mock('@/modules/billing/api/billing.fn', () => ({
  getBillingPanelFn: async () => ({
    summary: {
      status: 'active',
      isPaying: true,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    webhookConfigured: true,
  }),
  createPortalLinkFn: () => createPortalLinkFn(),
}))

const { BillingPanel } = await import('@/modules/billing/components/BillingPanel')

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <BillingPanel />
    </QueryClientProvider>,
  )
}

async function clickManage() {
  const button = await screen.findByRole('button', { name: en.manage })
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(button)
  return button
}

beforeEach(() => {
  createPortalLinkFn.mockReset()
})

describe('BillingPanel', () => {
  it('says what went wrong when the portal is refused', async () => {
    createPortalLinkFn.mockResolvedValue({ error: 'provider_rejected' })
    renderPanel()
    await clickManage()

    expect(await screen.findByText(en.error.provider_rejected)).toBeTruthy()
  })

  it('distinguishes an outage from a refusal, because the advice differs', async () => {
    createPortalLinkFn.mockResolvedValue({ error: 'provider_unavailable' })
    renderPanel()
    await clickManage()

    // One says try again, the other says trying again will not help. That
    // distinction is the whole reason the server classifies the failure.
    expect(await screen.findByText(en.error.provider_unavailable)).toBeTruthy()
    expect(screen.queryByText(en.error.provider_rejected)).toBeNull()
  })

  it('falls back to a real sentence for a code it has no copy for', async () => {
    createPortalLinkFn.mockResolvedValue({ error: 'some_future_code' })
    renderPanel()
    await clickManage()

    expect(await screen.findByText(en.error.unexpected)).toBeTruthy()
    expect(screen.queryByText(/some_future_code/)).toBeNull()
  })

  it('reports a throw without blaming the provider for it', async () => {
    // An expired session or a request that never left the browser is not Stripe.
    createPortalLinkFn.mockRejectedValue(new Error('network down'))
    renderPanel()
    await clickManage()

    expect(await screen.findByText(en.error.unexpected)).toBeTruthy()
  })

  it('shows nothing while the panel is idle', async () => {
    createPortalLinkFn.mockResolvedValue({ error: 'provider_rejected' })
    renderPanel()
    await screen.findByRole('button', { name: en.manage })

    expect(screen.queryByText(en.error.provider_rejected)).toBeNull()
  })
})

describe('the error catalogue', () => {
  // The component builds the key from a template literal, so the i18n gate
  // cannot see these. A code added to BillingErrorCode without copy would ship
  // silently in every language.
  const CODES = [
    'unconfigured',
    'unknown_customer',
    'provider_rejected',
    'provider_unavailable',
    'unexpected',
  ] as const

  it.each([
    ['en', en],
    ['es', es],
    ['dk', dk],
  ])('%s has a string for every code the server can return', (_lang, catalogue) => {
    for (const code of CODES) {
      const message = (catalogue.error as Record<string, string>)[code]
      expect(message, code).toBeTruthy()
      // A code echoed back as copy is a placeholder, not a translation.
      expect(message).not.toContain(code)
    }
  })
})
