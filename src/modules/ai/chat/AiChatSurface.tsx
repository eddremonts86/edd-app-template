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

// Loaded through a dynamic import, not a static one: the panel's modules pull
// in stylesheets with `import "….css"`, which Node cannot evaluate, so a static
// import puts them in the SSR graph and the server bails out of the whole
// subtree. Rendering it only after mount keeps them off the server entirely.
const ChatPanel = React.lazy(async () => ({
  default: (await import('@edd_remonts/ai-schadcn-chat')).ChatPanel,
}))

export function AiChatSurface({ fallback = null, ...props }: AiChatSurfaceProps) {
  // The sanctioned "am I on the client" read: the server snapshot is false, the
  // client snapshot true, and no state is set from an effect.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) return <>{fallback}</>

  return (
    <React.Suspense fallback={<>{fallback}</>}>
      <ChatPanel {...props} />
    </React.Suspense>
  )
}
