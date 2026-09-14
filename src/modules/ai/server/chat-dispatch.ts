import type { AiConfigFormData, AiProviderId } from '@/modules/ai/config'
import type { ProviderRegistryItem } from '@/modules/ai/providers'
import { createAiChatResponse, type ChatMessages } from './chat-execution'
import type { ChatMessage } from './chat-messages'
import { streamLmStudioChat, streamOllamaChat } from './chat-streaming'

/** Collapse a message body to plain text, whatever shape it arrived in. */
function flattenContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (part && typeof part === 'object' && 'text' in part) {
        const { text } = part as { text?: unknown }
        return typeof text === 'string' ? text : ''
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

interface DispatchChatOptions {
  provider: ProviderRegistryItem
  providerId: AiProviderId
  config: AiConfigFormData
  resolvedModel: string
  messages: ChatMessages
  params?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }
  conversationId?: string
}

/**
 * The single place a resolved provider runtime turns into a response.
 *
 * Both AI surfaces — the global search and the help chat — previously carried
 * their own copy of this branch, so a fix to one silently left the other
 * behind. They now share this.
 */
export async function dispatchProviderChat({
  provider,
  providerId,
  config,
  resolvedModel,
  messages,
  params,
  conversationId,
}: DispatchChatOptions): Promise<Response> {
  // The two paths want opposite message shapes and neither used to normalise,
  // so whichever shape the caller happened to send broke one of them:
  // Ollama's native API rejects an array with "cannot unmarshal array into ...
  // content of type string", and the adapter path rejects a plain string with
  // "has no content parts". Normalise here, once, for both surfaces.
  const inbound = messages ?? []

  const localMessages = inbound.map((message) => ({
    ...(message as Record<string, unknown>),
    content: flattenContent((message as { content?: unknown }).content),
  })) as unknown as ChatMessage[]

  // The adapter takes `{ role, content: string }`. Anything else it sees — a
  // content array, or a half-built `parts` list left behind by message
  // consolidation — makes it report "has no content parts" and refuse the call.
  // Reduce every message to that shape and drop the rest.
  const adapterMessages = inbound
    .map((message) => {
      const { role, content, parts } = message as {
        role?: unknown
        content?: unknown
        parts?: unknown
      }
      const text = flattenContent(content) || flattenContent(parts)
      return { role, content: text }
    })
    .filter((message) => message.content.length > 0) as unknown as ChatMessages

  if (providerId === 'ollama') {
    return streamOllamaChat({ config, params, messages: localMessages, resolvedModel })
  }

  if (providerId === 'lm-studio') {
    return streamLmStudioChat({ config, params, messages: localMessages, resolvedModel })
  }

  return createAiChatResponse({
    provider,
    config,
    providerId,
    resolvedModel,
    messages: adapterMessages,
    conversationId,
    params,
  })
}
