import { IconInnerShadowTop } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Navigation, Pin, PinOff, Search, WifiOff, X } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { getSidebarNavigation } from '@/modules'
import { useAiSearch } from '@/modules/ai'
import { AiChatSurface, createChatConfig } from '@/modules/ai/chat'
import { useCurrentUser } from '@/modules/users'
import { cn } from '@/shared/lib/utils'
import { NavMain } from './NavMain'
import { NavSecondary } from './NavSecondary'
import { NavUser } from './NavUser'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const { syncedUserId: currentUserId, roleKey } = useCurrentUser()
  void currentUserId

  const { isOpen: isSearchOpen, setIsOpen: setIsSearchOpen, isPinned, setIsPinned } = useAiSearch()
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const updateStatus = () => setIsOnline(window.navigator.onLine)
    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
        return
      }
      event.preventDefault()
      setIsSearchOpen(true)
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [setIsSearchOpen])

  const transactionBadge = undefined
  const overBudgetBadge = undefined

  const { main: navMain, secondary: navSecondary } = getSidebarNavigation({
    t,
    roleKey: roleKey ?? 'user',
    actions: {
      'open-ai-search': () => setIsSearchOpen(true),
    },
    badges: {
      'pending-transactions': transactionBadge,
      'over-budget': overBudgetBadge,
    },
  })

  // Its own persistKey: the search panel and the help page are separate
  // conversations, and sharing one would surface help answers here.
  const searchConfig = React.useMemo(
    () =>
      createChatConfig({
        persistKey: 'edd-app:global-search',
        ui: {
          placeholder: t('ai.search.placeholder'),
          enableConversationHistory: false,
        },
      }),
    [t],
  )

  const searchableLinks = [
    ...navMain.flatMap((section) => section.items).filter((item) => item.url),
    ...navSecondary.filter((item) => item.url),
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <a href="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">
                  {t('dashboard.acmeInc', 'Acme Inc.')}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <Sheet modal={!isPinned} open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent
          overlay={!isPinned}
          showCloseButton={false}
          className={cn('flex flex-col gap-0 p-0 sm:max-w-140', isPinned && 'shadow-none border-l')}
          onInteractOutside={(e) => {
            if (isPinned) e.preventDefault()
          }}
        >
          <SheetHeader className="border-b px-6 py-5 flex flex-col gap-1 text-left relative shrink-0">
            <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
              <Search className="size-5 text-primary" />
              {t('ai.search.title')}
            </SheetTitle>
            <SheetDescription className="text-sm">{t('ai.search.description')}</SheetDescription>
            <div className="absolute right-4 top-4 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsPinned(!isPinned)}
                title={
                  isPinned
                    ? t('dashboard.unpin', 'Unpin')
                    : t('dashboard.pinToRight', 'Pin to right')
                }
              >
                {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsSearchOpen(false)}
                title={t('common.close', 'Close')}
              >
                <X className="size-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden">
            {!isOnline && (
              <div className="text-destructive flex shrink-0 items-center gap-2 border-b px-6 py-3 text-xs">
                <WifiOff className="size-3" />
                {t('ai.search.offline')}
              </div>
            )}

            {/* The panel sizes itself with h-full, so it needs a parent with a
                resolved height rather than a bare flex child. */}
            <div className="flex min-h-0 flex-1 flex-col">
              <AiChatSurface
                config={searchConfig}
                layout="panel"
                className="h-full border-0"
                hideHeader
                fallback={
                  <p className="text-muted-foreground p-6 text-sm">{t('common.loading')}</p>
                }
              />
            </div>

            {/* Suggestions. h-auto overrides Command's own h-full, which would
                otherwise claim the whole sheet and collapse the panel to 0. */}
            <Command className="[&_[data-slot=command-group-heading]]:text-muted-foreground border-t rounded-none bg-muted/10 h-auto shrink-0">
              <CommandList className="p-6">
                <CommandGroup
                  heading={
                    <div className="text-xs font-semibold flex items-center gap-2 text-foreground tracking-wider uppercase">
                      <Navigation className="size-4 text-primary" />
                      {t('ai.search.suggestions')}
                    </div>
                  }
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-2">
                    {searchableLinks.slice(0, 4).map((item) => (
                      <CommandItem
                        key={item.title}
                        asChild
                        className="p-0 border hover:border-primary/50 bg-background hover:bg-primary/5"
                      >
                        <Link
                          to={item.url as '/dashboard'}
                          onClick={() => setIsSearchOpen(false)}
                          className="group flex w-full items-center gap-3 rounded-lg p-3 transition-all"
                        >
                          <div className="flex size-8 items-center justify-center rounded-md bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <item.icon className="size-4" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium group-hover:text-primary">
                              {item.title}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground">
                              {item.url}
                            </span>
                          </div>
                          <ChevronRight className="ml-auto size-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                        </Link>
                      </CommandItem>
                    ))}
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </SheetContent>
      </Sheet>
    </Sidebar>
  )
}
