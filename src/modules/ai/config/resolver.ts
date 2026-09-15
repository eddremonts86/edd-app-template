import { buildDefaultConfig, normalizeConfig } from './defaults'
import type { AiConfigFormData, AiProviderId } from './schema'

/**
 * Resolve a provider configuration by layering user overrides on top of the
 * built-in defaults (which already honour environment variables).
 *
 * Historical note: this previously read from `ia-config/*.js` legacy bootstrap
 * files. Those have been removed; `defaults.ts` is now the single source of
 * truth for provider defaults.
 */
export const resolveAiConfig = (
  providerId: AiProviderId,
  userConfig?: Partial<AiConfigFormData>,
): AiConfigFormData => {
  const base = buildDefaultConfig(providerId)
  // A blank in the persisted store must not shadow a value the environment
  // provides. Spreading userConfig wholesale meant an empty `apiKey` in
  // ai-config-store.json silenced a key that was sitting in .env, and every
  // provider reported AUTH_REQUIRED.
  const dropBlanks = <T extends Record<string, unknown>>(source?: T) =>
    Object.fromEntries(
      Object.entries(source ?? {}).filter(([, value]) => value !== undefined && value !== ''),
    )

  const { parameters, endpoints, ...rest } = userConfig ?? {}
  const overrides = {
    ...dropBlanks(rest as Record<string, unknown>),
    // `parameters` and `endpoints` are nested, so a blank inside them needs the
    // same treatment: a stored `parameters.model: ""` was replacing the model
    // the environment supplies, which left the provider with no model at all and
    // sent it whatever the calling route happened to pass as a fallback.
    parameters: { ...base.parameters, ...dropBlanks(parameters as Record<string, unknown>) },
    endpoints: { ...base.endpoints, ...dropBlanks(endpoints as Record<string, unknown>) },
  }
  return normalizeConfig({ ...base, ...overrides } as AiConfigFormData, providerId)
}

export const validateHardwareCompatibility = async (_config: AiConfigFormData) => true
