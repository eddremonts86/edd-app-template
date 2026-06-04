import { IconAlertTriangle, IconDatabase, IconHistory, IconUsers } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDbAdminStatus } from '../api/db-admin.queries'
import { AuditTab } from './AuditTab'
import { MigrationsTab } from './MigrationsTab'
import { ProfilesTab } from './ProfilesTab'

export function DatabaseAdminPage() {
  const { t } = useTranslation()
  const { data: status, isLoading } = useDbAdminStatus()

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <IconDatabase className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('databaseAdmin.title', 'Database administration')}
          </h1>
          {status?.activeProfileId ? (
            <Badge variant="default">
              {t('databaseAdmin.status.usingOverride', 'Using override profile')}
            </Badge>
          ) : (
            <Badge variant="secondary">
              {t('databaseAdmin.status.usingEnv', 'Using .env DATABASE_URL')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            'databaseAdmin.subtitle',
            'Manage connection profiles, test connectivity, and run migrations. Only super_admin can access this surface.',
          )}
        </p>
      </header>

      {!isLoading && status && !status.encryptionAvailable ? (
        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {t('databaseAdmin.encryptionMissing.title', 'Encryption secret missing')}
          </AlertTitle>
          <AlertDescription>
            {t(
              'databaseAdmin.encryptionMissing.body',
              'Set DB_CONFIG_SECRET (≥16 chars) in your server environment to enable secure profile storage. Writes are disabled until then.',
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profiles" className="gap-2">
            <IconUsers className="h-4 w-4" />
            {t('databaseAdmin.tabs.profiles', 'Profiles')}
          </TabsTrigger>
          <TabsTrigger value="migrations" className="gap-2">
            <IconDatabase className="h-4 w-4" />
            {t('databaseAdmin.tabs.migrations', 'Migrations')}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <IconHistory className="h-4 w-4" />
            {t('databaseAdmin.tabs.audit', 'Audit log')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          <ProfilesTab encryptionAvailable={status?.encryptionAvailable ?? false} />
        </TabsContent>
        <TabsContent value="migrations">
          <MigrationsTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
