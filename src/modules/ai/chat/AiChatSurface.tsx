import { ChatPanel } from '@edd_remonts/ai-schadcn-chat'
import type { ChatConfig } from '@edd_remonts/ai-schadcn-chat'
import * as React from 'react'

export interface AiChatSurfaceProps {
  config: ChatConfig
  layout?: 'panel' | 'floating' | 'fullpage'
  className?: string
  contentClassName?: string
  hideHeader?: boolean
  fallback?: React.ReactNode
}

/**
 * Client-only mount for the chat panel.
 *
 * The panel restores its transcript from localStorage on first render, which
 * the server has no equivalent of — rendering it during SSR produces markup
 * the client immediately replaces, so it waits for mount instead.
 */
export function AiChatSurface({ fallback = null, ...props }: AiChatSurfaceProps) {
  // useSyncExternalStore is the sanctioned "am I on the client" read: the
  // server snapshot is false, the client snapshot true, and nothing sets
  // state from an effect.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) return <>{fallback}</>

  return <ChatPanel {...props} />
}
