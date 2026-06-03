import type { AiConfigFormData } from '@/modules/ai/config'
import { probeProviderConfig } from '../shared'
import type { AiProviderStatus } from '../types'
import { discoverMiniMaxModels } from './models'
import { MINIMAX_PROVIDER_LABEL } from './types'

export async function probeMiniMaxProvider(config: AiConfigFormData): Promise<AiProviderStatus> {
  // MiniMax /v1/models endpoint may not be public; allow empty model lists so the
  // provider is still reported as reachable when only the chat endpoint works.
  return await probeProviderConfig({
    config,
    label: MINIMAX_PROVIDER_LABEL,
    discoverModels: discoverMiniMaxModels,
    allowEmptyModelList: true,
  })
}
