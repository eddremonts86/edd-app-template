// @vitest-environment node
import fs from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Provider defaults are env-derived and computed at import time, so pin the one
// this suite asserts before importing. Without this the expected value is
// whatever AI_OLLAMA_BASE_URL happens to be in the developer's .env, and the
// test passes or fails depending on whose machine runs it.
const OLLAMA_BASE_URL = 'http://localhost:11435/v1'
vi.stubEnv('AI_OLLAMA_BASE_URL', OLLAMA_BASE_URL)
vi.stubEnv('AI_API_BASE_URL', OLLAMA_BASE_URL)
vi.stubEnv('VITE_AI_BASE_URL', OLLAMA_BASE_URL)

const { readAiConfig } = await import('../../src/modules/ai/config/file-store')

// Mock dependencies before import
vi.mock('node:fs/promises')
vi.mock('node:child_process', () => ({
  exec: (_cmd: unknown, cb: (error: Error | null, result: { stdout: string }) => void) =>
    cb(null, { stdout: '' }),
}))

describe('Configuration Loading System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load default configuration when config file is missing', async () => {
    // Simulate file not found error
    vi.mocked(fs.access).mockRejectedValue(new Error('File not found'))

    const config = await readAiConfig()

    expect(config.activeProvider).toBe('llama-cpp')
    expect(config.providers['ollama'].parameters.model).toBeDefined()
    expect(config.providers['ollama'].baseUrl).toBe(OLLAMA_BASE_URL)
  })

  it('should load and merge user configuration correctly', async () => {
    // Simulate existing config file
    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({
        activeProvider: 'ollama',
        providers: {
          ollama: {
            parameters: {
              temperature: 0.9,
              model: 'custom-model',
            },
          },
        },
      }),
    )

    const config = await readAiConfig()

    expect(config.activeProvider).toBe('ollama')
    expect(config.providers['ollama'].parameters.temperature).toBe(0.9)
    expect(config.providers['ollama'].parameters.model).toBe('custom-model')
    // Should still have default values for other fields
    expect(config.providers['ollama'].parameters.max_tokens).toBe(2048)
  })

  it('should handle malformed configuration file gracefully', async () => {
    // Simulate existing but malformed config file
    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.readFile).mockResolvedValue('{ invalid json')

    const config = await readAiConfig()

    // Should fall back to defaults
    expect(config.activeProvider).toBe('llama-cpp')
    expect(config.providers['ollama'].parameters.model).toBeDefined()
  })
})
