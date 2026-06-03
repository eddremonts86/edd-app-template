import { IconAdjustmentsHorizontal, IconLoader2 } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/shared/lib/toast'
import { useSettings } from '../hooks/useSettings'
import { DevtoolsToggle } from './DevtoolsToggle'

export function DevToolsPage() {
  const { t } = useTranslation()
  const {
    pendingSettings,
    hasChanges,
    isSaving,
    setPendingDevtools,
    saveSettings,
    resetToDefaults,
  } = useSettings()

  async function handleSave() {
    try {
      await saveSettings()
      toast.success(t('settings.messages.saved'))
    } catch {
      toast.error(t('settings.messages.error'))
    }
  }

  function handleReset() {
    resetToDefaults()
    toast.info(t('settings.messages.reset'))
  }

  return (
    <div className="space-y-6 outline-none animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        <section className="space-y-6">
          <Card className="overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-amber-500/5">
            <CardHeader className="pb-4 flex flex-row items-start gap-4">
              <div className="rounded-xl bg-amber-500/10 p-2.5 shrink-0 ring-1 ring-amber-500/20">
                <IconAdjustmentsHorizontal className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  {t('settings.sections.development')}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Control developer tools and debugging utilities inside the environment.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <DevtoolsToggle
                value={pendingSettings.devtoolsVisible}
                onChange={setPendingDevtools}
              />
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="sticky bottom-6 z-10 flex items-center justify-end gap-3 rounded-xl border bg-background/80 p-4 shadow-lg backdrop-blur-md md:static md:shadow-none md:backdrop-blur-none">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isSaving}>
              {t('settings.actions.reset')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will restore all display settings back to default values.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              {t('settings.actions.saving')}
            </>
          ) : (
            t('settings.actions.save')
          )}
        </Button>
      </div>
    </div>
  )
}
