import { useQuery } from '@tanstack/react-query'
import { getCapabilitiesFn } from './capability.fn'

const CAPABILITIES_QUERY_KEY = ['module-capabilities'] as const

/**
 * Whether a module has the configuration it needs.
 *
 * Optimistic while loading: `isConfigured` is true until the server says
 * otherwise, so a configured app never flashes a "not configured" notice on
 * every navigation. The server refuses the action regardless — this only
 * governs what the UI says up front.
 */
export function useCapability(moduleId: string): { isConfigured: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: CAPABILITIES_QUERY_KEY,
    queryFn: () => getCapabilitiesFn(),
    // Configuration cannot change without a redeploy.
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return { isConfigured: data?.[moduleId] ?? true, isLoading }
}
