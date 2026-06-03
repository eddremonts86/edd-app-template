import { Link } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useInboxNotifications, useMarkNotificationsRead } from '@/modules/contact-messages'

/**
 * NotificationBell — template placeholder.
 * Wire up your app-specific notification source here.
 */
export function NotificationBell() {
  const { data, refetch } = useInboxNotifications(8)
  const markReadMutation = useMarkNotificationsRead()
  const items = data?.items ?? []
  const unreadItems = React.useMemo(() => items.filter((item) => !item.isRead), [items])
  const unreadCount = data?.unreadCount ?? unreadItems.length
  const displayCount = unreadCount > 0 ? unreadCount : unreadItems.length

  const markAsRead = React.useCallback(
    (id: string) => {
      if (id.startsWith('contact:')) return
      if (markReadMutation.isPending) return
      markReadMutation.mutate([id])
    },
    [markReadMutation],
  )

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          refetch()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          data-testid="dashboard-notification-trigger"
        >
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-background bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow-sm">
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-104 border-border/70 bg-popover/95 p-0 shadow-xl backdrop-blur"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {displayCount} pendientes
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unreadItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-112 space-y-1 overflow-auto p-2">
            {unreadItems.map((item) => (
              <Link
                key={item.id}
                to={item.link ?? '/dashboard/contact-messages'}
                onClick={() => markAsRead(item.id)}
                className="block w-full rounded-lg border border-border/60 bg-card/40 px-3 py-3 transition-colors hover:bg-accent/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold leading-tight text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {!item.isRead && (
                      <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        New
                      </span>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
