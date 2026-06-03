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
  return normalizeConfig({ ...base, ...userConfig }, providerId)
}

export const validateHardwareCompatibility = async (_config: AiConfigFormData) => true
