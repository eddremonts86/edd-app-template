import { useQueryClient } from '@tanstack/react-query'
import { useTQMutation, useTQuery } from '@/shared/lib/query'
import {
  activateDbProfileFn,
  deleteDbProfileFn,
  dryRunDbMigrationsFn,
  getDbAdminStatusFn,
  getDbAuditLogFn,
  listDbMigrationsFn,
  listDbProfilesFn,
  runDbMigrationsFn,
  saveDbProfileFn,
  testDbConnectionFn,
} from './db-admin.fn'

const QK = {
  status: ['database-admin', 'status'] as const,
  profiles: ['database-admin', 'profiles'] as const,
  audit: ['database-admin', 'audit'] as const,
  migrations: (profileId: string | null) => ['database-admin', 'migrations', profileId] as const,
}

export function useDbAdminStatus() {
  return useTQuery(QK.status, () => getDbAdminStatusFn(), { cache: 'standard' })
}

export function useDbProfiles() {
  return useTQuery(QK.profiles, () => listDbProfilesFn(), { cache: 'standard' })
}

export function useDbAuditLog() {
  return useTQuery(QK.audit, () => getDbAuditLogFn(), { cache: 'realtime' })
}

export function useDbMigrations(profileId: string | null, enabled = true) {
  return useTQuery(QK.migrations(profileId), () => listDbMigrationsFn({ data: { profileId } }), {
    cache: 'realtime',
    enabled,
  })
}

export function useSaveDbProfile() {
  return useTQMutation(
    ['database-admin', 'save-profile'],
    (input: Parameters<typeof saveDbProfileFn>[0]['data']) => saveDbProfileFn({ data: input }),
    {
      invalidateKeys: [QK.profiles, QK.status, QK.audit],
      successMessage: 'Profile saved',
    },
  )
}

export function useDeleteDbProfile() {
  return useTQMutation(
    ['database-admin', 'delete-profile'],
    (id: string) => deleteDbProfileFn({ data: { id } }),
    {
      invalidateKeys: [QK.profiles, QK.status, QK.audit],
      successMessage: 'Profile deleted',
    },
  )
}

export function useActivateDbProfile() {
  const qc = useQueryClient()
  return useTQMutation(
    ['database-admin', 'activate-profile'],
    (id: string | null) => activateDbProfileFn({ data: { id } }),
    {
      successMessage: 'Active profile updated. New connection in effect.',
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['database-admin'] })
      },
    },
  )
}

export function useTestDbConnection() {
  return useTQMutation(
    ['database-admin', 'test-connection'],
    (input: Parameters<typeof testDbConnectionFn>[0]['data']) =>
      testDbConnectionFn({ data: input }),
    {
      showSuccessToast: false,
      invalidateKeys: [QK.profiles, QK.audit],
    },
  )
}

export function useDryRunDbMigrations() {
  return useTQMutation(
    ['database-admin', 'migrations-dryrun'],
    (profileId: string | null) => dryRunDbMigrationsFn({ data: { profileId } }),
    {
      showSuccessToast: false,
      invalidateKeys: [QK.audit],
    },
  )
}

export function useRunDbMigrations() {
  return useTQMutation(
    ['database-admin', 'migrations-run'],
    (profileId: string | null) => runDbMigrationsFn({ data: { profileId } }),
    {
      successMessage: 'Migrations applied',
      invalidateKeys: [QK.audit],
    },
  )
}
