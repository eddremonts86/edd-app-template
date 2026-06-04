import { IconCheck, IconPlayerPlay, IconRefresh, IconX } from '@tabler/icons-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useDbAdminStatus,
  useDbMigrations,
  useDbProfiles,
  useDryRunDbMigrations,
  useRunDbMigrations,
} from '../api/db-admin.queries'
import type { MigrationRunReport } from '../model/migration'

export function MigrationsTab() {
  const { t } = useTranslation()
  const { data: profiles } = useDbProfiles()
  const { data: status } = useDbAdminStatus()
  const [target, setTarget] = React.useState<string>('__env__')

  const profileId = target === '__env__' ? null : target
  const { data: migrations, isLoading, refetch } = useDbMigrations(profileId)
  const dryRun = useDryRunDbMigrations()
  const runMutation = useRunDbMigrations()

  const [report, setReport] = React.useState<MigrationRunReport | null>(null)

  const handleDryRun = async () => {
    const result = await dryRun.mutateAsync(profileId)
    setReport(result)
    if (result.error) {
      toast.error(t('databaseAdmin.migrations.dryRunFail', 'Dry-run failed'), {
        description: result.error,
      })
    } else {
      const pendingCount = result.files.length
      toast.success(
        t('databaseAdmin.migrations.dryRunOk', 'Dry-run OK — {{n}} pending file(s)', {
          n: pendingCount,
        }),
      )
    }
  }

  const handleRun = () => {
    const label =
      target === '__env__'
        ? t('databaseAdmin.envProfile', '.env DATABASE_URL')
        : (profiles?.find((p) => p.id === target)?.label ?? target)
    toast.warning(
      t('databaseAdmin.migrations.confirmTitle', 'Apply migrations on {{label}}?', { label }),
      {
        description: t(
          'databaseAdmin.migrations.confirmBody',
          'Writes will be committed per file. Failed files roll back and abort the run.',
        ),
        action: {
          label: t('databaseAdmin.actions.apply', 'Apply now'),
          onClick: async () => {
            const result = await runMutation.mutateAsync(profileId)
            setReport(result)
            refetch()
          },
        },
        duration: 15000,
      },
    )
  }

  const pending = migrations?.filter((m) => !m.applied).length ?? 0
  const applied = migrations?.filter((m) => m.applied).length ?? 0
  const hasMigrations = migrations && migrations.length > 0

  let migrationRows: React.ReactNode
  if (isLoading) {
    migrationRows = (
      <TableRow>
        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
          {t('common.loading')}
        </TableCell>
      </TableRow>
    )
  } else if (hasMigrations) {
    migrationRows = migrations.map((m) => (
      <TableRow key={m.file}>
        <TableCell className="font-mono text-xs">{m.file}</TableCell>
        <TableCell>
          {m.applied ? (
            <Badge variant="secondary" className="gap-1">
              <IconCheck className="h-3 w-3" />
              {t('databaseAdmin.migrations.applied', 'Applied')}
            </Badge>
          ) : (
            <Badge variant="default">{t('databaseAdmin.migrations.pending', 'Pending')}</Badge>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {m.appliedAt ? new Date(m.appliedAt).toLocaleString() : '—'}
        </TableCell>
      </TableRow>
    ))
  } else {
    migrationRows = (
      <TableRow>
        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
          {t('databaseAdmin.migrations.empty', 'No migrations on disk')}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {t('databaseAdmin.migrations.title', 'Drizzle migrations')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              'databaseAdmin.migrations.subtitle',
              'Run pending migrations against any saved profile or the current .env connection.',
            )}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1 min-w-56">
            <label className="text-xs text-muted-foreground">
              {t('databaseAdmin.migrations.target', 'Target connection')}
            </label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__env__">
                  {t('databaseAdmin.envProfile', '.env DATABASE_URL')}
                  {status?.activeProfileId ? '' : ' (active)'}
                </SelectItem>
                {profiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                    {p.id === status?.activeProfileId ? ' (active)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => refetch()} size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-3 text-sm">
        <Badge variant="secondary">
          {t('databaseAdmin.migrations.applied', 'Applied')}: {applied}
        </Badge>
        <Badge variant={pending > 0 ? 'default' : 'secondary'}>
          {t('databaseAdmin.migrations.pending', 'Pending')}: {pending}
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('databaseAdmin.migrations.file', 'File')}</TableHead>
              <TableHead>{t('databaseAdmin.migrations.status', 'Status')}</TableHead>
              <TableHead>{t('databaseAdmin.migrations.appliedAt', 'Applied at')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{migrationRows}</TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleDryRun} disabled={dryRun.isPending || !pending}>
          {dryRun.isPending
            ? t('databaseAdmin.actions.testing', 'Testing…')
            : t('databaseAdmin.actions.dryRun', 'Dry-run')}
        </Button>
        <Button onClick={handleRun} disabled={runMutation.isPending || !pending} className="gap-2">
          <IconPlayerPlay className="h-4 w-4" />
          {runMutation.isPending
            ? t('databaseAdmin.actions.applying', 'Applying…')
            : t('databaseAdmin.actions.apply', 'Apply pending')}
        </Button>
      </div>

      {report ? <MigrationReportCard report={report} /> : null}
    </div>
  )
}

interface MigrationReportCardProps {
  report: MigrationRunReport
}

function MigrationReportCard({ report }: Readonly<MigrationReportCardProps>) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {report.error ? (
            <IconX className="h-4 w-4 text-destructive" />
          ) : (
            <IconCheck className="h-4 w-4 text-green-600" />
          )}
          {report.dryRun
            ? t('databaseAdmin.migrations.report.dryRun', 'Dry-run report')
            : t('databaseAdmin.migrations.report.applied', 'Run report')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {report.error ? <p className="text-destructive">{report.error}</p> : null}
        {report.files.map((f) => (
          <div key={f.file} className="rounded border p-2">
            <div className="font-mono text-xs flex items-center gap-2">
              <span>{f.file}</span>
              {f.appliedNow ? (
                <Badge variant="secondary">applied</Badge>
              ) : (
                <Badge variant="default">planned</Badge>
              )}
            </div>
            <ul className="mt-1 text-xs space-y-0.5">
              {f.statements.map((s) => (
                <li key={s.index} className="flex gap-2">
                  <span className={s.ok ? 'text-green-600' : 'text-destructive'}>
                    {s.ok ? 'ok' : 'fail'}
                  </span>
                  <span className="text-muted-foreground">{s.durationMs}ms</span>
                  <span className="font-mono truncate">{s.sqlPreview}</span>
                </li>
              ))}
            </ul>
            {f.error ? <p className="text-destructive text-xs mt-1">{f.error}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
