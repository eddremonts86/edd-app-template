import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'
import type { User } from '../model/types'

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const { t } = useTranslation()

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: t('users.table.user', 'User'),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border/60">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate flex items-center gap-2">
                <span className="truncate">{user.name}</span>
                {user.provider && user.provider !== 'local' && (
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider py-0 px-1.5 h-4">
                    {user.provider === 'clerk' ? 'Clerk' : 'Better Auth'}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1 truncate font-mono">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'roleKey',
      header: t('users.table.role', 'Role / Access'),
      cell: ({ row }) => {
        const role = row.original.roleKey ?? 'user'
        const labelKeyMap = {
          super_admin: 'users.form.roleSuperAdmin',
          admin: 'users.form.roleAdmin',
          user: 'users.form.roleUser',
        } as const
        const variantMap = {
          super_admin: 'destructive',
          admin: 'default',
          user: 'secondary',
        } as const
        return <Badge variant={variantMap[role]}>{t(labelKeyMap[role])}</Badge>
      },
    },
    {
      accessorKey: 'provider',
      header: t('users.filters.provider', 'Provider'),
      cell: ({ row }) => {
        const provider = row.original.provider ?? 'local'
        return <span className="text-xs capitalize">{provider}</span>
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('users.table.joined', 'Joined'),
      cell: ({ row }) => {
        const date = row.original.createdAt
        return (
          <span className="text-xs text-muted-foreground font-mono">
            {date ? new Date(date).toLocaleDateString() : '-'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('common.actions', 'Actions')}</div>,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(user)}
              title={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(user)}
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const filters = [
    {
      columnId: 'roleKey',
      label: t('users.filters.role', 'Role'),
      type: 'select' as const,
      options: [
        { label: t('users.form.roleUser', 'User'), value: 'user' },
        { label: t('users.form.roleAdmin', 'Admin'), value: 'admin' },
        { label: t('users.form.roleSuperAdmin', 'Super Admin'), value: 'super_admin' },
      ],
    },
    {
      columnId: 'provider',
      label: t('users.filters.provider', 'Provider'),
      type: 'select' as const,
      options: [
        { label: 'Local', value: 'local' },
        { label: 'Clerk', value: 'clerk' },
        { label: 'Better Auth', value: 'better-auth' },
      ],
    },
  ]

  return (
    <div className="w-full">
      <UnifiedDataTable
        columns={columns}
        data={users}
        filterColumn="name"
        filters={filters}
        enableSelection={false}
        enableGrouping={false}
        enablePagination={true}
        enableExport={true}
        exportFileName="users-export.csv"
        initialPageSize={10}
      />
    </div>
  )
}
