import type { ChatConfig, UiConfig } from '@edd_remonts/ai-schadcn-chat'

/**
 * One config for both AI surfaces — the global search and the help page.
 *
 * `baseUrl` is this app, not MiniMax. `@edd_remonts/ai-schadcn-chat` calls the
 * provider from the browser, so pointing it at MiniMax directly would ship the
 * API key to every visitor. `/api/ai/chat/completions` speaks the same OpenAI
 * protocol, keeps the key on the server, picks the provider from the server
 * config, and still applies the system prompt, reference context and audit log.
 */
const PROXY: ChatConfig['provider'] = {
  kind: 'openai-compatible',
  baseUrl: '/api/ai',
  chatPath: '/chat/completions',
  // The route authorises by session cookie; there is no client-side key to send.
  credentials: { apiKey: '' },
}

interface SurfaceOptions {
  /** Distinct per surface so the two panels don't share a transcript. */
  persistKey: string
  systemPrompt: string
  ui?: Partial<UiConfig>
}

export function createChatConfig({ persistKey, systemPrompt, ui }: SurfaceOptions): ChatConfig {
  return {
    provider: PROXY,
    // The server resolves the real model from its own config; an empty id here
    // would be sent verbatim, so name the surface instead of a provider model.
    model: { id: 'auto', label: 'Assistant', tools: false, vision: false },
    systemPrompt,
    temperature: 0.7,
    persistKey,
    retry: { attempts: 2, initialDelayMs: 800, maxDelayMs: 6_000 },
    ui: {
      // The server owns provider and model choice, so the pickers would only
      // offer options it ignores.
      showModelSelector: false,
      showDocumentPicker: false,
      showTokenCount: false,
      enableFileUpload: false,
      enableVoiceInput: false,
      theme: 'system',
      ...ui,
    },
  }
}
