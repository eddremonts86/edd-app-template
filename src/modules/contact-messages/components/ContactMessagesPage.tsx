import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Mail, RefreshCcw, AlertTriangle } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
} from '@/components/ui'
import { toast } from '@/shared/lib/toast'
import { TableSkeleton } from '@/shared/ui/tables'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'
import { useContactMessages, useMarkContactMessageRead } from '../api/contact-messages.queries'
import type { ContactMessage } from '../model/types'

type SelectedMessage = Pick<ContactMessage, 'email' | 'projectType' | 'createdAt' | 'message'>

export function ContactMessagesPage() {
  const { t } = useTranslation()
  const [selectedMessage, setSelectedMessage] = React.useState<SelectedMessage | null>(null)

  const { data, error, isLoading, isError, isFetching, refetch } = useContactMessages(100)
  const markReadMutation = useMarkContactMessageRead()

  const rows = data?.data ?? []

  const isForbiddenError = React.useMemo(() => {
    if (!error) return false
    let message: string
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else {
      message = JSON.stringify(error)
    }
    return /forbidden|unauthorized|401|403/i.test(message)
  }, [error])

  const handleMarkRead = React.useCallback(
    async (id: string, read: boolean) => {
      try {
        await markReadMutation.mutateAsync({ id, read })
        toast.success(
          read
            ? t('contactMessages.messages.markReadSuccess')
            : t('contactMessages.messages.markNewSuccess'),
        )
      } catch (err) {
        toast.error(t('contactMessages.messages.markError'), {
          description: err instanceof Error ? err.message : t('common.unknownError'),
        })
      }
    },
    [markReadMutation, t],
  )

  const columns: ColumnDef<ContactMessage>[] = React.useMemo(
    () => [
      {
        accessorKey: 'email',
        header: t('contactMessages.table.email'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{row.original.email}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {new Date(row.original.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'projectType',
        header: t('contactMessages.table.projectType'),
        cell: ({ row }) => <span className="capitalize text-sm">{row.original.projectType}</span>,
      },
      {
        accessorKey: 'message',
        header: t('contactMessages.table.message'),
        enableSorting: false,
        cell: ({ row }) => (
          <p className="line-clamp-2 max-w-sm text-sm text-muted-foreground">
            {row.original.message || t('contactMessages.table.emptyMessage')}
          </p>
        ),
      },
      {
        id: 'view',
        header: t('contactMessages.table.view'),
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedMessage(row.original)}
          >
            {t('contactMessages.actions.readFull')}
          </Button>
        ),
      },
      {
        accessorKey: 'status',
        header: t('contactMessages.table.status'),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'new' ? 'default' : 'outline'}>
            {row.original.status === 'new'
              ? t('contactMessages.filters.statusNew')
              : t('contactMessages.filters.statusRead')}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">{t('contactMessages.table.actions')}</div>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant={row.original.status === 'new' ? 'default' : 'outline'}
              disabled={markReadMutation.isPending}
              onClick={() => handleMarkRead(row.original.id, row.original.status !== 'read')}
            >
              {row.original.status === 'new'
                ? t('contactMessages.actions.markRead')
                : t('contactMessages.actions.markNew')}
            </Button>
          </div>
        ),
      },
    ],
    [t, markReadMutation.isPending, handleMarkRead],
  )

  const statusFilters = React.useMemo(
    () => [
      {
        columnId: 'status',
        label: t('contactMessages.filters.status'),
        type: 'select' as const,
        options: [
          { label: t('contactMessages.filters.statusNew'), value: 'new' },
          { label: t('contactMessages.filters.statusRead'), value: 'read' },
        ],
      },
    ],
    [t],
  )

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl pt-10 px-4">
        <Alert variant="destructive" className="p-6 rounded-2xl flex flex-col gap-4 relative">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <AlertTitle className="text-base font-semibold">
                {isForbiddenError ? t('common.error.title') : t('contactMessages.error.title')}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {isForbiddenError
                  ? t('common.noPermission')
                  : t('contactMessages.error.description')}
              </AlertDescription>
            </div>
          </div>

          <Separator className="bg-destructive/20 my-2" />

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-destructive/80">
              {t('contactMessages.error.title', 'What you can do')}
            </h4>
            <ul className="list-disc pl-5 text-xs space-y-1 opacity-90 leading-relaxed text-destructive/95">
              <li>
                {t(
                  'contactMessages.error.item1',
                  'Make sure you have the correct permissions (administrator role required).',
                )}
              </li>
              <li>
                {t(
                  'contactMessages.error.item2',
                  'Make sure you are authenticated in the workspace.',
                )}
              </li>
              <li>
                {t(
                  'contactMessages.error.item3',
                  'Consult the technical guide on role management.',
                )}
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              asChild
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Link to="/dashboard">
                {t('contactMessages.backToDashboard', 'Back to Dashboard')}
              </Link>
            </Button>
            <Button variant="link" asChild className="text-destructive font-medium text-xs">
              <Link to="/starter/architecture">
                {t('contactMessages.error.architectureLink', 'Architecture & Roles Manual →')}
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  let content: React.ReactNode
  if (isLoading) {
    content = <TableSkeleton rows={6} />
  } else {
    content = (
      <UnifiedDataTable
        columns={columns}
        data={rows}
        filterColumn="email"
        filters={statusFilters}
        enableSelection={false}
        enableGrouping={false}
        enablePagination={true}
        enableExport={false}
        initialPageSize={10}
        emptyStateLabel={t('contactMessages.empty.noData', 'No messages found')}
      />
    )
  }

  return (
    <div className="flex h-full flex-col gap-5 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('contactMessages.title')}
            {data && (
              <span className="ml-2 text-2xl font-normal text-muted-foreground">
                ({data.totalCount})
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">{t('contactMessages.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            {t('contactMessages.unreadBadge', { count: data?.unreadCount ?? 0 })}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {t('contactMessages.actions.refresh')}
          </Button>
        </div>
      </div>

      {content}

      <Sheet
        open={Boolean(selectedMessage)}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="space-y-2 border-b px-6 pb-4 pt-6 text-left">
            <SheetTitle>{t('contactMessages.sheet.title')}</SheetTitle>
            <SheetDescription>{t('contactMessages.sheet.description')}</SheetDescription>
          </SheetHeader>

          {selectedMessage && (
            <div className="px-6 pb-6 pt-5">
              <div className="space-y-3 border-b pb-4">
                <p className="text-sm font-semibold text-foreground text-wrap-pretty">
                  {selectedMessage.message?.slice(0, 120) || t('contactMessages.table.fullMessage')}
                </p>
                <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <p>
                    <span className="mr-2 text-muted-foreground">
                      {t('contactMessages.table.email')}:
                    </span>
                    <span className="font-medium text-foreground">{selectedMessage.email}</span>
                  </p>
                  <p>
                    <span className="mr-2 text-muted-foreground">
                      {t('contactMessages.table.createdAt')}:
                    </span>
                    <span className="text-foreground">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p className="sm:col-span-2">
                    <span className="mr-2 text-muted-foreground">
                      {t('contactMessages.table.projectType')}:
                    </span>
                    <span className="capitalize text-foreground">
                      {selectedMessage.projectType}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 max-h-[58vh] overflow-y-auto pr-2">
                <p className="whitespace-pre-wrap wrap-break-word text-[15px] leading-8 text-foreground">
                  {selectedMessage.message || t('contactMessages.table.emptyMessage')}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
