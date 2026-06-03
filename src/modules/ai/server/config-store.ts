import type { AiConfigStore } from '@/modules/ai/config'
import { readAiConfig, writeAiConfig } from '@/modules/ai/config/file-store'

export async function readPersistedAiConfig() {
  return readAiConfig()
}

export async function readPersistedAiConfigOrEmpty() {
  try {
    return await readPersistedAiConfig()
  } catch {
    return createEmptyAiConfigStore()
  }
}

export async function writePersistedAiConfig(config: AiConfigStore) {
  await writeAiConfig(config)
  return config
}

export function createEmptyAiConfigStore() {
  return {
    activeProvider: 'llama-cpp',
    providers: {},
  }
}

export function createAiConfigReadErrorPayload(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : ''

  return {
    activeProvider: 'lm-studio',
    providers: {},
    _debug_error: errorMessage,
    _debug_stack: errorStack,
  }
}
