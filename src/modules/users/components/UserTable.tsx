import { useTranslation } from 'react-i18next'
import { Mail, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { User } from '../model/types'

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage: () => void
  scrollResetKey?: string
}

export function UserTable({
  users,
  onEdit,
  onDelete,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: UserTableProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('users.table.user', 'User')}</TableHead>
            <TableHead>{t('users.table.role', 'Role / Access')}</TableHead>
            <TableHead>{t('users.table.joined', 'Joined')}</TableHead>
            <TableHead className="w-20 text-right">{t('common.actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-border/60">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate flex items-center gap-2">
                      <span className="truncate">{user.name}</span>
                      {user.provider && user.provider !== 'local' && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {user.provider === 'clerk' ? 'Clerk' : 'Better Auth'}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {(() => {
                  const role = user.roleKey ?? 'user'
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
                })()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell className="text-right">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="h-12 flex items-center justify-center border-t border-border/40">
        {hasNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage
              ? t('common.loading')
              : t('common.loadMore', { defaultValue: 'Load more' })}
          </Button>
        )}
      </div>
    </div>
  )
}
