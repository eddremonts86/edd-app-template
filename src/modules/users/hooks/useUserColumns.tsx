import type { ColumnDef } from '@tanstack/react-table'
import { Mail, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '../model/types'

export function useUserColumns(
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
): ColumnDef<User, unknown>[] {
  const { t } = useTranslation()

  return React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('users.table.user', 'User'),
        cell: ({ row }) => {
          const avatar = row.original.avatar || undefined
          const name = row.original.name
          const email = row.original.email
          return (
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/5 text-primary font-bold">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground leading-none">{name}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" /> {email}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('users.table.joined', 'Joined'),
        cell: ({ row }) => {
          const date = row.original.createdAt
          return (
            <span className="text-sm text-muted-foreground">
              {date ? new Date(date).toLocaleDateString() : '-'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit', 'Edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete', 'Delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [t, onEdit, onDelete],
  )
}
