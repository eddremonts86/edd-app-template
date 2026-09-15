/**
 * Re-encodes the internal AG-UI event stream as OpenAI Chat Completions SSE.
 *
 * `@edd_remonts/ai-schadcn-chat` talks the OpenAI protocol and calls the
 * endpoint from the browser. Pointing it straight at MiniMax would ship the
 * API key to the client, so it points at this app instead: same protocol,
 * key stays on the server, and the request still carries the session cookie
 * so the route can authorise it.
 */

interface OpenAiDelta {
  role?: 'assistant'
  content?: string
}

function chunk(
  id: string,
  model: string,
  created: number,
  delta: OpenAiDelta,
  finishReason: string | null = null,
  usage?: unknown,
) {
  return {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
    ...(usage ? { usage } : {}),
  }
}

/** AG-UI usage is camelCase; the OpenAI schema is snake_case. */
function toOpenAiUsage(usage: unknown) {
  if (!usage || typeof usage !== 'object') return undefined
  const u = usage as Record<string, unknown>
  const pick = (...keys: string[]) => {
    for (const key of keys) if (typeof u[key] === 'number') return u[key] as number
  }
  const prompt = pick('promptTokens', 'inputTokens', 'prompt_tokens')
  const completion = pick('completionTokens', 'outputTokens', 'completion_tokens')
  const total = pick('totalTokens', 'total_tokens')
  if (prompt === undefined && completion === undefined && total === undefined) return undefined
  return {
    prompt_tokens: prompt ?? 0,
    completion_tokens: completion ?? 0,
    total_tokens: total ?? (prompt ?? 0) + (completion ?? 0),
  }
}

export function toOpenAiChatCompletionsResponse(upstream: Response): Response {
  if (!upstream.ok || !upstream.body) return upstream

  const id = `chatcmpl-${Date.now().toString(36)}`
  const created = Math.floor(Date.now() / 1000)
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const send = (value: unknown) => encoder.encode(`data: ${JSON.stringify(value)}\n\n`)

  const reader = upstream.body.getReader()
  // SSE events split across reads: keep the tail until a newline completes it.
  // Splitting each read in isolation drops any event that straddles a chunk
  // boundary, which is most of them on a fast stream.
  let buffer = ''
  let openedRole = false
  let usage: unknown
  // Reported by the upstream events; the client never names a model.
  let model = 'unknown'

  // `start` with a drain loop, not `pull` — the dev server's response adapter
  // only consumes a stream that pushes, so a pull-driven one stalls after the
  // first enqueue and the client receives nothing.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (!payload || payload === '[DONE]') continue

            let event: Record<string, unknown>
            try {
              event = JSON.parse(payload) as Record<string, unknown>
            } catch {
              continue
            }

            const meta = (event.metadata as { tanstack?: { model?: unknown } } | undefined)
              ?.tanstack
            if (typeof meta?.model === 'string') model = meta.model
            else if (typeof event.model === 'string') model = event.model

            if (event.type === 'TEXT_MESSAGE_CONTENT' && typeof event.delta === 'string') {
              const delta: OpenAiDelta = openedRole
                ? { content: event.delta }
                : { role: 'assistant', content: event.delta }
              openedRole = true
              controller.enqueue(send(chunk(id, model, created, delta)))
            } else if (event.type === 'RUN_FINISHED') {
              usage = Array.isArray(event.usage) ? event.usage[0] : event.usage
            } else if (event.type === 'RUN_ERROR') {
              // The adapter path puts the text at `message`, the local
              // streamers nest it under `error`. Relay whichever one arrived:
              // a generic "upstream error" hides things the user needs to
              // read, such as MiniMax's rate-limit notice.
              const message =
                (typeof event.message === 'string' ? event.message : undefined) ??
                (event.error as { message?: string } | undefined)?.message ??
                'Upstream AI error'
              const code = typeof event.code === 'string' ? event.code : 'upstream_error'
              controller.enqueue(send({ error: { message, type: code, code } }))
            }
          }
        }

        controller.enqueue(send(chunk(id, model, created, {}, 'stop', toOpenAiUsage(usage))))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stream failed'
        controller.enqueue(send({ error: { message, type: 'stream_error' } }))
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
