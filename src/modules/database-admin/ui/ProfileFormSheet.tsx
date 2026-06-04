import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/shared/lib/toast'
import { useSaveDbProfile, useTestDbConnection } from '../api/db-admin.queries'
import { type DbProfile, type DbProfileInput, dbProfileInputSchema } from '../model/profile'

interface ProfileFormSheetProps {
  mode: 'create' | 'edit'
  profile?: DbProfile
  onDone: () => void
  onCancel: () => void
}

type FormState = {
  name: string
  label: string
  connectionUrl: string
  host: string
  port: string
  database: string
  user: string
  password: string
  schema: string
  ssl: '' | 'disable' | 'require' | 'verify-full'
  poolMax: string
}

function initialFromProfile(profile?: DbProfile): FormState {
  return {
    name: profile?.name ?? '',
    label: profile?.label ?? '',
    connectionUrl: profile?.connectionUrl ?? '',
    host: profile?.host ?? '',
    port: profile?.port ? String(profile.port) : '',
    database: profile?.database ?? '',
    user: profile?.user ?? '',
    password: '',
    schema: profile?.schema ?? '',
    ssl: profile?.ssl ?? '',
    poolMax: profile?.poolMax ? String(profile.poolMax) : '',
  }
}

function buildInput(state: FormState, id?: string): DbProfileInput | null {
  const port = state.port ? Number(state.port) : undefined
  const poolMax = state.poolMax ? Number(state.poolMax) : undefined
  const candidate = {
    id,
    name: state.name.trim(),
    label: state.label.trim(),
    driver: 'postgres' as const,
    connectionUrl: state.connectionUrl.trim() || undefined,
    host: state.host.trim() || undefined,
    port,
    database: state.database.trim() || undefined,
    user: state.user.trim() || undefined,
    password: state.password || undefined,
    schema: state.schema.trim() || undefined,
    ssl: state.ssl || undefined,
    poolMax,
  }
  const parsed = dbProfileInputSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export function ProfileFormSheet({
  mode,
  profile,
  onDone,
  onCancel,
}: Readonly<ProfileFormSheetProps>) {
  const { t } = useTranslation()
  const [state, setState] = React.useState<FormState>(() => initialFromProfile(profile))
  const [error, setError] = React.useState<string | null>(null)

  const saveMutation = useSaveDbProfile()
  const testMutation = useTestDbConnection()

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
    setError(null)
    const input = buildInput(state, profile?.id)
    if (!input) {
      setError(
        t(
          'databaseAdmin.form.invalid',
          'Provide a name, label, and either a connectionUrl or host+database.',
        ),
      )
      return
    }
    await saveMutation.mutateAsync(input)
    onDone()
  }

  const handleTest = async () => {
    const input = buildInput(state, profile?.id)
    if (!input) {
      setError(
        t(
          'databaseAdmin.form.invalid',
          'Provide a name, label, and either a connectionUrl or host+database.',
        ),
      )
      return
    }
    const result = await testMutation.mutateAsync(input)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="label">{t('databaseAdmin.fields.label', 'Label')}</Label>
          <Input
            id="label"
            value={state.label}
            onChange={(e) => update('label', e.target.value)}
            placeholder="Production Supabase"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="name">{t('databaseAdmin.fields.name', 'Slug')}</Label>
          <Input
            id="name"
            value={state.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="prod-supabase"
            required
            disabled={mode === 'edit'}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="connectionUrl">
          {t('databaseAdmin.fields.connectionUrl', 'Connection URL (optional)')}
        </Label>
        <Input
          id="connectionUrl"
          value={state.connectionUrl}
          onChange={(e) => update('connectionUrl', e.target.value)}
          placeholder="postgres://user:pass@host:5432/db?sslmode=require"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          {t(
            'databaseAdmin.form.urlOrParts',
            'Provide either a full URL or the discrete fields below.',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="host">{t('databaseAdmin.fields.host', 'Host')}</Label>
          <Input id="host" value={state.host} onChange={(e) => update('host', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="port">{t('databaseAdmin.fields.port', 'Port')}</Label>
          <Input
            id="port"
            type="number"
            value={state.port}
            onChange={(e) => update('port', e.target.value)}
            placeholder="5432"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="database">{t('databaseAdmin.fields.database', 'Database')}</Label>
          <Input
            id="database"
            value={state.database}
            onChange={(e) => update('database', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="user">{t('databaseAdmin.fields.user', 'User')}</Label>
          <Input id="user" value={state.user} onChange={(e) => update('user', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">{t('databaseAdmin.fields.password', 'Password')}</Label>
          <Input
            id="password"
            type="password"
            value={state.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder={mode === 'edit' ? '••••• (unchanged)' : ''}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="schema">{t('databaseAdmin.fields.schema', 'Schema')}</Label>
          <Input
            id="schema"
            value={state.schema}
            onChange={(e) => update('schema', e.target.value)}
            placeholder="public"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ssl">{t('databaseAdmin.fields.ssl', 'SSL mode')}</Label>
          <Select
            value={state.ssl || 'none'}
            onValueChange={(v) => update('ssl', v === 'none' ? '' : (v as FormState['ssl']))}
          >
            <SelectTrigger id="ssl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('common.none', 'None')}</SelectItem>
              <SelectItem value="disable">disable</SelectItem>
              <SelectItem value="require">require</SelectItem>
              <SelectItem value="verify-full">verify-full</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="poolMax">{t('databaseAdmin.fields.poolMax', 'Pool max')}</Label>
          <Input
            id="poolMax"
            type="number"
            value={state.poolMax}
            onChange={(e) => update('poolMax', e.target.value)}
            placeholder="10"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={testMutation.isPending}
        >
          {testMutation.isPending
            ? t('databaseAdmin.actions.testing', 'Testing…')
            : t('databaseAdmin.actions.test', 'Test connection')}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? t('common.saving', 'Saving…') : t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
