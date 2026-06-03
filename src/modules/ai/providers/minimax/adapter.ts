import { createOpenaiChat } from '@tanstack/ai-openai'
import type { AiConfigFormData } from '@/modules/ai/config'
import { getProviderHeaders } from '../headers'
import { normalizeOpenAiCompatibleBaseUrl } from '../shared'
import type { ProviderRegistryItem } from '../types'
import { MINIMAX_PROVIDER_ID, MINIMAX_PROVIDER_LABEL } from './types'

function buildMiniMaxAdapter(
  config: AiConfigFormData,
): (model: string) => ReturnType<typeof createOpenaiChat> {
  const apiKey = config.apiKey || config.token || ''
  const baseUrl = normalizeOpenAiCompatibleBaseUrl(config.baseUrl)

  return (model) =>
    createOpenaiChat(model as Parameters<typeof createOpenaiChat>[0], apiKey, {
      baseURL: baseUrl,
      defaultHeaders: getProviderHeaders(config),
    })
}

export const miniMaxProvider: ProviderRegistryItem = {
  id: MINIMAX_PROVIDER_ID,
  label: MINIMAX_PROVIDER_LABEL,
  buildAdapter: buildMiniMaxAdapter,
}
