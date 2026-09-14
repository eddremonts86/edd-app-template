import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AiChatSurface, createChatConfig } from '../chat'

/**
 * The help surface is `@edd_remonts/ai-schadcn-chat`. It replaced ~1.3k lines
 * of bespoke chat UI that reimplemented streaming, markdown rendering,
 * transcript persistence and provider selection — all of which the library
 * already does, and now does the same way as the global search.
 */
export function HelpChatPage() {
  const { t } = useTranslation()

  const config = React.useMemo(
    () =>
      createChatConfig({
        persistKey: 'edd-app:help-chat',
        ui: {
          title: t('ai.chat.title'),
          subtitle: t('ai.chat.supportAssistant'),
          placeholder: t('ai.chat.placeholder'),
        },
      }),
    [t],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="shrink-0 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('ai.chat.title')}</h1>
        <p className="text-muted-foreground">{t('ai.chat.emptyDescription')}</p>
      </div>

      <AiChatSurface
        config={config}
        layout="fullpage"
        className="min-h-0 flex-1"
        fallback={<p className="text-muted-foreground text-sm">{t('common.loading')}</p>}
      />
    </div>
  )
}
