import { UserPlus } from 'lucide-react'
import * as React from 'react'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { TableEmptyState, TableErrorState, TableSkeleton } from '@/shared/ui/tables'
import { useCreateUser, useDeleteUser, useUsers, useUpdateUser } from '../api/users.queries'
import type { User } from '../model/types'
import { UserForm } from './UserForm'
import { UserTable } from './UserTable'

export function UsersPage() {
  const { t } = useTranslation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [deletingUser, setDeletingUser] = React.useState<User | null>(null)
  const { user: currentUser } = useAppAuth()

  const { data: allUsers, isLoading, isError } = useUsers(1000)
  const users = React.useMemo(() => allUsers ?? [], [allUsers])

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  // Deleting a user is irreversible, so it gets a focus-trapped modal that names
  // the account — not a transient toast in the opposite corner that never says
  // which user is about to go.
  const handleDelete = React.useCallback((user: User) => setDeletingUser(user), [])

  // Locking yourself out is unrecoverable from the UI.
  const isSelf =
    !!deletingUser &&
    !!currentUser &&
    (deletingUser.authUserId === currentUser.id || deletingUser.email === currentUser.email)

  if (isError) {
    return (
      <TableErrorState
        titleKey="users.error.title"
        descriptionKey="users.error.description"
        retryKey="users.error.retry"
      />
    )
  }

  const totalCount = allUsers?.length ?? 0

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('users.title')}
            {totalCount > 0 && (
              <span className="ml-2 text-muted-foreground font-normal text-2xl">
                ({totalCount})
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('users.actions.new')}
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : totalCount === 0 ? (
        <TableEmptyState isSearchActive={false} onClearSearch={() => {}} />
      ) : (
        <UserTable users={users} onEdit={setEditingUser} onDelete={handleDelete} />
      )}

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-2xl">
          <CrudSheetHeader
            title={t('users.sheet.createTitle')}
            description={t('users.sheet.createDescription')}
            onClose={() => setIsCreateOpen(false)}
            showPing={false}
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
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-2xl">
          <CrudSheetHeader
            title={t('users.sheet.editTitle')}
            description={t('users.sheet.editDescription')}
            onClose={() => setEditingUser(null)}
            showPing={false}
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

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.confirm.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {isSelf
                ? t('users.confirm.deleteSelf')
                : t('users.confirm.deleteBody', {
                    name: deletingUser?.name ?? '',
                    email: deletingUser?.email ?? '',
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSelf || deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingUser || isSelf) return
                deleteMutation.mutate(deletingUser.id)
                setDeletingUser(null)
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
