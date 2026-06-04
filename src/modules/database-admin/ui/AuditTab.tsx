import { IconAlertCircle, IconCheck } from '@tabler/icons-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDbAuditLog } from '../api/db-admin.queries'

export function AuditTab() {
  const { t } = useTranslation()
  const { data: entries, isLoading } = useDbAuditLog()
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const hasEntries = entries && entries.length > 0

  let body: React.ReactNode
  if (isLoading) {
    body = (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
          {t('common.loading')}
        </TableCell>
      </TableRow>
    )
  } else if (hasEntries) {
    body = entries.map((entry) => {
      const isOpen = expanded === entry.id
      return (
        <React.Fragment key={entry.id}>
          <TableRow
            className="cursor-pointer"
            onClick={() => setExpanded(isOpen ? null : entry.id)}
          >
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(entry.timestamp).toLocaleString()}
            </TableCell>
            <TableCell className="text-sm">
              {entry.actorEmail ?? entry.actorUserId ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-xs">
                {entry.action}
              </Badge>
            </TableCell>
            <TableCell>
              {entry.result === 'ok' ? (
                <Badge variant="secondary" className="gap-1">
                  <IconCheck className="h-3 w-3 text-green-600" /> OK
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <IconAlertCircle className="h-3 w-3" /> ERROR
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground max-w-md truncate">
              {entry.message ?? '—'}
            </TableCell>
          </TableRow>
          {isOpen && entry.diff ? (
            <TableRow>
              <TableCell colSpan={5} className="bg-muted/40">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(entry.diff), null, 2)
                    } catch {
                      return entry.diff
                    }
                  })()}
                </pre>
              </TableCell>
            </TableRow>
          ) : null}
        </React.Fragment>
      )
    })
  } else {
    body = (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
          {t('databaseAdmin.audit.empty', 'No audit entries yet')}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t('databaseAdmin.audit.title', 'Audit log')}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'databaseAdmin.audit.subtitle',
            'Last 500 sensitive operations. Newest first. Passwords are never logged.',
          )}
        </p>
      </div>

      <ScrollArea className="h-[60vh] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>{t('databaseAdmin.audit.when', 'When')}</TableHead>
              <TableHead>{t('databaseAdmin.audit.actor', 'Actor')}</TableHead>
              <TableHead>{t('databaseAdmin.audit.action', 'Action')}</TableHead>
              <TableHead>{t('databaseAdmin.audit.result', 'Result')}</TableHead>
              <TableHead>{t('databaseAdmin.audit.details', 'Details')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
