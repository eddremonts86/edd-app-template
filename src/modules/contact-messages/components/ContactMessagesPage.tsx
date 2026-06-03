import { Mail, RefreshCcw } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { toast } from '@/shared/lib/toast'
import { TableEmptyState, TableErrorState, TableSearchBar, TableSkeleton } from '@/shared/ui/tables'
import { useContactMessages, useMarkContactMessageRead } from '../api/contact-messages.queries'

export function ContactMessagesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<'new' | 'read' | 'all'>('all')
  const [selectedMessage, setSelectedMessage] = React.useState<{
    email: string
    projectType: string
    createdAt: string
    message: string | null
  } | null>(null)
  const deferredSearch = React.useDeferredValue(search)

  const { data, error, isLoading, isError, isFetching, refetch } = useContactMessages(
    100,
    deferredSearch,
    status,
  )
  const markReadMutation = useMarkContactMessageRead()

  const rows = data?.data ?? []
  const hasActiveFilters = Boolean(search.trim()) || status !== 'all'
  const isForbiddenError = React.useMemo(() => {
    if (!error) return false
    let message = ''
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else {
      message = JSON.stringify(error)
    }
    return /forbidden|unauthorized|401|403/i.test(message)
  }, [error])

  const handleMarkRead = async (id: string, read: boolean) => {
    try {
      await markReadMutation.mutateAsync({ id, read })
      toast.success(
        read
          ? t('contactMessages.messages.markReadSuccess')
          : t('contactMessages.messages.markNewSuccess'),
      )
    } catch (error) {
      toast.error(t('contactMessages.messages.markError'), {
        description: error instanceof Error ? error.message : t('common.unknownError'),
      })
    }
  }

  if (isError) {
    return (
      <TableErrorState
        titleKey={isForbiddenError ? 'common.error.title' : 'contactMessages.error.title'}
        descriptionKey={
          isForbiddenError ? 'common.noPermission' : 'contactMessages.error.description'
        }
        retryKey="contactMessages.error.retry"
      />
    )
  }

  let content: React.ReactNode
  if (isLoading) {
    content = <TableSkeleton rows={6} />
  } else if (rows.length === 0) {
    content = (
      <TableEmptyState
        isSearchActive={hasActiveFilters}
        onClearSearch={() => {
          React.startTransition(() => {
            setSearch('')
            setStatus('all')
          })
        }}
        noDataKey="contactMessages.empty.noData"
        noResultsKey="contactMessages.empty.noResults"
        clearSearchKey="common.clearFilters"
      />
    )
  } else {
    content = (
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('contactMessages.table.email')}</TableHead>
              <TableHead>{t('contactMessages.table.projectType')}</TableHead>
              <TableHead>{t('contactMessages.table.message')}</TableHead>
              <TableHead>{t('contactMessages.table.view')}</TableHead>
              <TableHead>{t('contactMessages.table.status')}</TableHead>
              <TableHead>{t('contactMessages.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{row.email}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString()}
                  </p>
                </TableCell>
                <TableCell className="capitalize">{row.projectType}</TableCell>
                <TableCell className="max-w-md">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {row.message || t('contactMessages.table.emptyMessage')}
                  </p>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedMessage({
                        email: row.email,
                        projectType: row.projectType,
                        createdAt: row.createdAt,
                        message: row.message,
                      })
                    }
                  >
                    {t('contactMessages.actions.readFull')}
                  </Button>
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === 'new' ? 'default' : 'outline'}>
                    {row.status === 'new'
                      ? t('contactMessages.filters.statusNew')
                      : t('contactMessages.filters.statusRead')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={row.status === 'new' ? 'default' : 'outline'}
                    disabled={markReadMutation.isPending}
                    onClick={() => handleMarkRead(row.id, row.status !== 'read')}
                  >
                    {row.status === 'new'
                      ? t('contactMessages.actions.markRead')
                      : t('contactMessages.actions.markNew')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            {t('contactMessages.actions.refresh')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <TableSearchBar
            searchInput={search}
            onSearchChange={(value) => React.startTransition(() => setSearch(value))}
            onClear={() => React.startTransition(() => setSearch(''))}
            loadedCount={rows.length}
            totalCount={data?.totalCount ?? 0}
            showSpinner={isFetching}
            showCount={false}
            placeholderKey="contactMessages.filters.search"
          />
        </div>

        <Select value={status} onValueChange={(value: 'new' | 'read' | 'all') => setStatus(value)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={t('contactMessages.filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('contactMessages.filters.statusAll')}</SelectItem>
            <SelectItem value="new">{t('contactMessages.filters.statusNew')}</SelectItem>
            <SelectItem value="read">{t('contactMessages.filters.statusRead')}</SelectItem>
          </SelectContent>
        </Select>
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
