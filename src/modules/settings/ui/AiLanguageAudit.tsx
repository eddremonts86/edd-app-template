import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Activity, RefreshCw, Settings2, ChevronDown } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Command, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/shared/lib/utils'
import {
  useDebouncedSearch,
  TableSearchBar,
  TableEmptyState,
} from '@/shared/ui/tables'

interface AuditLog {
  timestamp: string
  locale: string
  query: string
  providerId: string
  model: string
}

interface AiLanguageAuditProps {
  className?: string
}

function tryFormatDate(iso: string) {
  try {
    return format(new Date(iso), 'MMM d, HH:mm:ss')
  } catch {
    return iso
  }
}

export function AiLanguageAudit({ className }: AiLanguageAuditProps) {
  const queryClient = useQueryClient()
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ['ai-audit'],
    queryFn: async () => {
      const res = await fetch('/api/ai/audit')
      if (!res.ok) return { logs: [], settings: {} }
      const json = await res.json()
      if (Array.isArray(json)) return { logs: json, settings: { forceLocale: undefined } }
      return json as { logs: AuditLog[]; settings: { forceLocale?: string } }
    },
    refetchInterval: 5000,
  })

  const settings = data?.settings

  const sortedLogs = React.useMemo(() => {
    return [...(data?.logs ?? [])].reverse()
  }, [data?.logs])

  const [providerFilter, setProviderFilter] = React.useState<string | null>(null)
  const [localeFilter, setLocaleFilter] = React.useState<string | null>(null)
  const [limit, setLimit] = React.useState(15)

  const uniqueProviders = React.useMemo(() => {
    const set = new Set<string>()
    sortedLogs.forEach((log) => {
      if (log.providerId) set.add(log.providerId)
    })
    return Array.from(set)
  }, [sortedLogs])

  const uniqueLocales = React.useMemo(() => {
    const set = new Set<string>()
    sortedLogs.forEach((log) => {
      if (log.locale) set.add(log.locale)
    })
    return Array.from(set)
  }, [sortedLogs])

  const filteredLogs = React.useMemo(() => {
    let logs = sortedLogs
    
    if (providerFilter) {
      logs = logs.filter((log) => log.providerId === providerFilter)
    }
    
    if (localeFilter) {
      logs = logs.filter((log) => log.locale === localeFilter)
    }

    if (!activeSearch) return logs
    const q = activeSearch.toLowerCase()
    return logs.filter(
      (log) =>
        log.query.toLowerCase().includes(q) ||
        log.providerId.toLowerCase().includes(q) ||
        log.model.toLowerCase().includes(q) ||
        log.locale.toLowerCase().includes(q),
    )
  }, [sortedLogs, activeSearch, providerFilter, localeFilter])

  const displayedLogs = React.useMemo(() => {
    return filteredLogs.slice(0, limit)
  }, [filteredLogs, limit])

  const handleClearAllFilters = () => {
    setProviderFilter(null)
    setLocaleFilter(null)
    clearSearch()
    setLimit(15)
  }

  const mutation = useMutation({
    mutationFn: async (newSettings: { forceLocale?: string }) => {
      await fetch('/api/ai/audit', {
        method: 'POST',
        body: JSON.stringify(newSettings),
        headers: { 'Content-Type': 'application/json' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-audit'] })
    },
  })



  return (
    <Card
      className={cn(
        'mt-8 overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md bg-card',
        className,
      )}
    >
      <CardHeader className="border-b bg-muted/40 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Language Enforcement Audit
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Monitor and control AI language compliance in real-time.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <Label
                htmlFor="force-locale"
                className="whitespace-nowrap text-xs font-medium text-muted-foreground"
              >
                Force Language:
              </Label>
              <Select
                value={settings?.forceLocale || 'auto'}
                onValueChange={(val) =>
                  mutation.mutate({ forceLocale: val === 'auto' ? undefined : val })
                }
              >
                <SelectTrigger
                  id="force-locale"
                  className="h-7 w-35 border-none bg-transparent px-2 text-xs font-medium focus:ring-0 hover:bg-muted/50 transition-colors"
                >
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="auto">Auto (OS Detected)</SelectItem>
                  <SelectItem value="en">English (en)</SelectItem>
                  <SelectItem value="es">Spanish (es)</SelectItem>
                  <SelectItem value="dk">Danish (dk)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 shadow-sm active:scale-95 transition-all"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
              <span className="sr-only sm:not-sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-4 h-150 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <TableSearchBar
              searchInput={searchInput}
              onSearchChange={(val) => {
                setSearchInput(val)
                setLimit(15)
              }}
              onClear={() => {
                clearSearch()
                setLimit(15)
              }}
              loadedCount={displayedLogs.length}
              totalCount={filteredLogs.length}
              showSpinner={isRefetching}
              placeholderKey="common.search"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Provider Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-xs bg-muted/20">
                  <span>Provider:</span>
                  <span className="font-bold text-primary">
                    {providerFilter || 'All'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Providers">
                      <CommandItem
                        onClick={() => {
                          setProviderFilter(null)
                          setLimit(15)
                        }}
                        className="cursor-pointer"
                      >
                        All Providers
                      </CommandItem>
                      {uniqueProviders.map((prov) => (
                        <CommandItem
                          key={prov}
                          onClick={() => {
                            setProviderFilter(prov)
                            setLimit(15)
                          }}
                          className="cursor-pointer"
                        >
                          {prov}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Locale Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-xs bg-muted/20">
                  <span>Locale:</span>
                  <span className="font-bold text-primary uppercase">
                    {localeFilter || 'All'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Locales">
                      <CommandItem
                        onClick={() => {
                          setLocaleFilter(null)
                          setLimit(15)
                        }}
                        className="cursor-pointer"
                      >
                        All Locales
                      </CommandItem>
                      {uniqueLocales.map((loc) => (
                        <CommandItem
                          key={loc}
                          onClick={() => {
                            setLocaleFilter(loc)
                            setLimit(15)
                          }}
                          className="cursor-pointer uppercase"
                        >
                          {loc}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {(providerFilter || localeFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClearAllFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {displayedLogs.length > 0 ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <ScrollArea className="flex-1 rounded-md border border-border/50 max-h-[500px]">
              <Table className="relative w-full">
                <TableHeader className="sticky top-0 bg-card z-10 shadow-xs">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[100px]">Locale</TableHead>
                    <TableHead className="w-[180px]">Provider</TableHead>
                    <TableHead>Query Snippet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLogs.map((log, index) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {tryFormatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'font-mono text-[10px] uppercase tracking-wider shadow-sm border-transparent',
                            log.locale === 'en'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20'
                              : log.locale === 'es'
                                ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20'
                                : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/20',
                          )}
                        >
                          {log.locale}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-medium text-foreground">{log.providerId}</span>
                          <span className="text-[10px] text-muted-foreground font-mono opacity-80">
                            {log.model}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="truncate max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-md border border-transparent hover:border-border/50 hover:bg-background shadow-sm transition-colors"
                          title={log.query}
                        >
                          {log.query}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {filteredLogs.length > limit && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 shadow-sm active:scale-95 transition-all"
                  onClick={() => setLimit((prev) => prev + 15)}
                >
                  Load More ({filteredLogs.length - limit} remaining)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <TableEmptyState isSearchActive={!!activeSearch || !!providerFilter || !!localeFilter} onClearSearch={handleClearAllFilters} />
        )}
      </CardContent>
    </Card>
  )
}
