import { buildDefaultConfig } from '@/modules/ai/config'
import { MINIMAX_PROVIDER_ID } from './types'

export const getMiniMaxDefaultConfig = () => buildDefaultConfig(MINIMAX_PROVIDER_ID)
