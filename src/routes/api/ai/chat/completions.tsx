import { createFileRoute } from '@tanstack/react-router'
import { toOpenAiChatCompletionsResponse } from '@/modules/ai/server'
import { handleChatPost } from './route'

interface OpenAiChatRequest {
  model?: string
  messages?: unknown
  temperature?: number
  top_p?: number
  max_tokens?: number
}

/**
 * OpenAI Chat Completions, spoken by this app.
 *
 * `@edd_remonts/ai-schadcn-chat` calls this from the browser; the provider
 * key and the provider choice stay on the server. The body is translated
 * into the shape the internal pipeline already takes, so the system prompt,
 * reference context and audit log all still apply.
 */
const handleOpenAiChatPost = async ({ request }: { request: Request }) => {
  const body = (await request.json()) as OpenAiChatRequest

  const upstreamRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({
      messages: Array.isArray(body.messages) ? body.messages : [],
      // `model` is deliberately not forwarded. The client never picks the
      // provider or the model — that is the point of proxying — and the id the
      // library sends is a UI label the provider would reject outright.
      params: {
        ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
        ...(body.top_p !== undefined ? { topP: body.top_p } : {}),
        ...(body.max_tokens !== undefined ? { maxTokens: body.max_tokens } : {}),
      },
    }),
  })

  const upstream = await handleChatPost({ request: upstreamRequest })
  return toOpenAiChatCompletionsResponse(upstream)
}

export const Route = createFileRoute('/api/ai/chat/completions')({
  component: () => null,
  server: {
    handlers: {
      POST: handleOpenAiChatPost,
    },
  },
})
