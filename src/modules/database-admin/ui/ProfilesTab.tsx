import {
  IconCheck,
  IconCircleDashedCheck,
  IconDots,
  IconEdit,
  IconPlus,
  IconPlugConnected,
  IconTrash,
} from '@tabler/icons-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/shared/lib/toast'
import {
  useActivateDbProfile,
  useDbAdminStatus,
  useDbProfiles,
  useDeleteDbProfile,
  useTestDbConnection,
} from '../api/db-admin.queries'
import type { DbProfile } from '../model/profile'
import { ProfileFormSheet } from './ProfileFormSheet'

interface ProfilesTabProps {
  encryptionAvailable: boolean
}

function renderTestResult(profile: DbProfile, label: string) {
  if (profile.lastTestResult === 'ok') {
    return (
      <Badge variant="secondary" className="gap-1">
        <IconCheck className="h-3 w-3 text-green-600" /> OK
      </Badge>
    )
  }
  if (profile.lastTestResult === 'error') {
    return <Badge variant="destructive">FAIL</Badge>
  }
  return <span className="text-muted-foreground">{label}</span>
}

export function ProfilesTab({ encryptionAvailable }: Readonly<ProfilesTabProps>) {
  const { t } = useTranslation()
  const { data: profiles, isLoading } = useDbProfiles()
  const { data: status } = useDbAdminStatus()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DbProfile | null>(null)

  const deleteMutation = useDeleteDbProfile()
  const activateMutation = useActivateDbProfile()
  const testMutation = useTestDbConnection()

  const handleDelete = (profile: DbProfile) => {
    toast.error(t('databaseAdmin.confirm.deleteTitle', 'Delete this profile?'), {
      description: t(
        'databaseAdmin.confirm.deleteBody',
        'This permanently removes the saved profile.',
      ),
      action: {
        label: t('common.delete'),
        onClick: () => deleteMutation.mutate(profile.id),
      },
      duration: 10000,
    })
  }

  const handleTest = async (profile: DbProfile) => {
    const result = await testMutation.mutateAsync({ profileId: profile.id })
    if (result.ok) {
      toast.success(
        t('databaseAdmin.test.success', 'Connection OK ({{ms}}ms)', { ms: result.latencyMs }),
        { description: result.serverVersion ?? undefined },
      )
    } else {
      toast.error(t('databaseAdmin.test.failed', 'Connection failed'), {
        description: result.error ?? undefined,
      })
    }
  }

  const handleActivate = (profile: DbProfile | null) => {
    const id = profile?.id ?? null
    const label = profile ? profile.label : t('databaseAdmin.envProfile', '.env DATABASE_URL')
    toast.warning(t('databaseAdmin.confirm.activateTitle', 'Hot-swap database connection?'), {
      description: t(
        'databaseAdmin.confirm.activateBody',
        'All in-flight queries will use the new connection. Active = {{label}}',
        { label },
      ),
      action: {
        label: t('common.confirm'),
        onClick: () => activateMutation.mutate(id),
      },
      duration: 12000,
    })
  }

  const activeId = status?.activeProfileId ?? null
  const hasProfiles = profiles && profiles.length > 0

  let bodyRows: React.ReactNode
  if (isLoading) {
    bodyRows = (
      <TableRow>
        <TableCell colSpan={4} className="text-muted-foreground text-center py-6">
          {t('common.loading')}
        </TableCell>
      </TableRow>
    )
  } else if (hasProfiles) {
    bodyRows = profiles.map((profile) => {
      const isActive = profile.id === activeId
      return (
        <TableRow key={profile.id}>
          <TableCell>
            <div className="flex items-center gap-2">
              <span className="font-medium">{profile.label}</span>
              {isActive ? (
                <Badge variant="default" className="gap-1">
                  <IconCircleDashedCheck className="h-3 w-3" />
                  {t('databaseAdmin.status.active', 'Active')}
                </Badge>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">{profile.name}</div>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
            {profile.host
              ? `${profile.host}:${profile.port ?? 5432}/${profile.database ?? ''}`
              : (profile.connectionUrl ?? '—')}
          </TableCell>
          <TableCell className="text-sm">
            {renderTestResult(profile, '—')}
            {profile.lastTestedAt ? (
              <div className="text-xs text-muted-foreground">
                {new Date(profile.lastTestedAt).toLocaleString()}
              </div>
            ) : null}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <IconDots className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleTest(profile)}>
                  <IconPlugConnected className="h-4 w-4 mr-2" />
                  {t('databaseAdmin.actions.test', 'Test connection')}
                </DropdownMenuItem>
                {isActive ? null : (
                  <DropdownMenuItem onClick={() => handleActivate(profile)}>
                    <IconCircleDashedCheck className="h-4 w-4 mr-2" />
                    {t('databaseAdmin.actions.activate', 'Activate')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setEditing(profile)}
                  disabled={!encryptionAvailable}
                >
                  <IconEdit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(profile)}
                  className="text-destructive"
                  disabled={isActive}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      )
    })
  } else {
    bodyRows = (
      <TableRow>
        <TableCell colSpan={4} className="text-muted-foreground text-center py-6">
          {t('databaseAdmin.profiles.empty', 'No profiles yet')}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {t('databaseAdmin.profiles.title', 'Connection profiles')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              'databaseAdmin.profiles.subtitle',
              'Define alternative databases. Activate one to hot-swap without restarting.',
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {activeId ? (
            <Button variant="outline" onClick={() => handleActivate(null)}>
              {t('databaseAdmin.actions.revertToEnv', 'Revert to .env')}
            </Button>
          ) : null}
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={!encryptionAvailable}
            className="gap-2"
          >
            <IconPlus className="h-4 w-4" />
            {t('databaseAdmin.actions.newProfile', 'New profile')}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('databaseAdmin.fields.label', 'Label')}</TableHead>
              <TableHead>{t('databaseAdmin.fields.target', 'Target')}</TableHead>
              <TableHead>{t('databaseAdmin.fields.lastTest', 'Last test')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>{bodyRows}</TableBody>
        </Table>
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-2xl">
          <CrudSheetHeader
            title={t('databaseAdmin.sheet.createTitle', 'New connection profile')}
            description={t(
              'databaseAdmin.sheet.createDescription',
              'Add a Supabase / external Postgres profile. Test it before activating.',
            )}
            onClose={() => setIsCreateOpen(false)}
            showPing={false}
          />
          <CrudSheetBody className="p-6">
            <ProfileFormSheet
              mode="create"
              onDone={() => setIsCreateOpen(false)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>

      <Sheet open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-2xl">
          <CrudSheetHeader
            title={t('databaseAdmin.sheet.editTitle', 'Edit profile')}
            description={t(
              'databaseAdmin.sheet.editDescription',
              'Update connection details. Password stays unchanged unless you type a new one.',
            )}
            onClose={() => setEditing(null)}
            showPing={false}
          />
          <CrudSheetBody className="p-6">
            {editing && (
              <ProfileFormSheet
                mode="edit"
                profile={editing}
                onDone={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            )}
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
