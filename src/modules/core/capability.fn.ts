import { createServerFn } from '@tanstack/react-start'
import { resolveCapabilities } from './capability'

/**
 * Ships the capability map to the client.
 *
 * The client cannot compute this itself: the keys involved are server-only
 * secrets and must never reach the browser, so the answer is computed where the
 * secrets are and only booleans cross the wire.
 */
export const getCapabilitiesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Record<string, boolean>> => resolveCapabilities(),
)
