import { UserPlus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { toast } from '@/shared/lib/toast'
import {
  flattenInfinitePages,
  TableEmptyState,
  TableErrorState,
  TableSearchBar,
  TableSkeleton,
} from '@/shared/ui/tables'
import { useCreateUser, useDeleteUser, useInfiniteUsers, useUpdateUser } from '../api/users.queries'
import type { User } from '../model/types'
import { UserForm } from './UserForm'
import { UserTable } from './UserTable'

export function UsersPage() {
  const { t } = useTranslation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [search, setSearch] = React.useState('')
  const deferredSearch = React.useDeferredValue(search)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, isError } =
    useInfiniteUsers(10, deferredSearch)

  const hasActiveFilters = Boolean(search.trim())

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const handleDelete = (user: User) => {
    toast.error(t('users.confirm.delete'), {
      description: t('common.confirm'),
      action: {
        label: t('common.delete'),
        onClick: () => deleteMutation.mutate(user.id),
      },
      duration: 10000,
    })
  }

  if (isError) {
    return (
      <TableErrorState
        titleKey="users.error.title"
        descriptionKey="users.error.description"
        retryKey="users.error.retry"
      />
    )
  }

  const allUsers = flattenInfinitePages<User>(data?.pages as Array<{ data: unknown[] }> | undefined)
  const totalCount = (data?.pages[0] as { totalCount?: number } | undefined)?.totalCount ?? 0

  const clearFilters = () => {
    React.startTransition(() => {
      setSearch('')
    })
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('users.title')}
            {totalCount > 0 && (
              <span className="ml-2 text-muted-foreground font-normal text-2xl">
                ({totalCount})
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">
            {t('users.subtitle', 'Manage your team members, roles and permissions.')}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('users.actions.new')}
        </Button>
      </div>

      <TableSearchBar
        searchInput={search}
        onSearchChange={(value) => React.startTransition(() => setSearch(value))}
        onClear={() => React.startTransition(() => setSearch(''))}
        loadedCount={allUsers.length}
        totalCount={totalCount}
        showSpinner={isFetching && !isFetchingNextPage}
        placeholderKey="users.filters.search"
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : allUsers.length === 0 ? (
        <TableEmptyState isSearchActive={hasActiveFilters} onClearSearch={clearFilters} />
      ) : (
        <div className="relative group flex-1 min-h-0 flex flex-col">
          <UserTable
            users={allUsers}
            onEdit={setEditingUser}
            onDelete={handleDelete}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            scrollResetKey={deferredSearch}
          />
        </div>
      )}

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-135">
          <CrudSheetHeader
            title={t('users.sheet.createTitle')}
            description={t('users.sheet.createDescription')}
            onClose={() => setIsCreateOpen(false)}
          />
          <CrudSheetBody className="p-6">
            <UserForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values)
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>

      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-135">
          <CrudSheetHeader
            title={t('users.sheet.editTitle')}
            description={t('users.sheet.editDescription')}
            onClose={() => setEditingUser(null)}
          />
          <CrudSheetBody className="p-6">
            {editingUser && (
              <UserForm
                defaultValues={editingUser}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingUser.id, data: values })
                  setEditingUser(null)
                }}
                onCancel={() => setEditingUser(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}

