import {
  IconAdjustments,
  IconDeviceFloppy,
  IconFileText,
  IconLoader2,
  IconPlugConnected,
  IconRefresh,
  IconSettings,
  IconWorldCheck,
  IconPlayerPlay,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AiConfigFormData, AiProvider } from '@/modules/ai/config'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import {
  useAiConfig,
  useAiConfigStore,
  useAiProviderModels,
  useAiProviderStatuses,
  useResetAiConfig,
  useTestAiConnection,
  useUpdateAiConfig,
} from '../api/ai-config.queries'
import { AiLanguageAudit } from './AiLanguageAudit'

const PROVIDER_DEFAULTS: Record<AiProvider, Partial<AiConfigFormData>> = {
  'llama-cpp': {
    baseUrl: 'http://localhost:8080/v1',
    port: 8080,
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '',
      download: '',
      status: '',
    },
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    port: 11434,
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '/api/pull',
      download: '/api/pull',
      status: '',
    },
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    port: 443,
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
    },
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    port: 443,
    endpoints: {
      chat: '/messages',
      models: '/messages',
    },
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
  'lm-studio': {
    baseUrl: 'http://localhost:1234/v1',
    port: 1234,
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '/models/load',
      download: '/models/download',
      status: '/models/download/status/:job_id',
    },
    parameters: {
      model: 'auto',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
  minimax: {
    baseUrl: 'https://api.minimax.io/v1',
    port: 443,
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
    },
    parameters: {
      model: 'MiniMax-Text-01',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
}

interface ProviderStatus {
  id: string
  available: boolean
  status: string
  latencyMs?: number
  modelCount?: number
  message?: string
  resolvedModelId?: string | null
  activeModelId?: string | null
}

interface TestResult {
  ok: boolean
  message: string
  testedAt: number
}

interface ProviderStatusCardProps {
  provider: {
    id: string
    title: string
    description: string
  }
  index: number
  isActive: boolean
  isAvailable: boolean
  isError: boolean
  apiBaseUrl: string
  resolvedModel: string
  status: ProviderStatus | undefined
  testResult: TestResult | undefined
  isTesting: boolean
  onSelect: () => void
  onTest: () => void
}

function ProviderStatusCard({
  provider,
  index,
  isActive,
  isAvailable,
  isError,
  apiBaseUrl,
  resolvedModel,
  status,
  testResult,
  isTesting,
  onSelect,
  onTest,
}: ProviderStatusCardProps) {
  const { t } = useTranslation()
  const [showDetails, setShowDetails] = React.useState(false)
  const hasDetails = !!(apiBaseUrl || resolvedModel || status?.modelCount || testResult)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`group relative flex flex-col items-center text-center p-6 rounded-xl border transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
        isActive
          ? 'bg-card border-primary shadow-md ring-1 ring-primary/20'
          : 'bg-card/45 hover:bg-card border-border hover:border-primary/50 hover:shadow-md dark:bg-card/25'
      }`}
    >
      {/* Priority Index */}
      <div className="absolute top-3 left-4 text-lg font-bold text-muted-foreground/20 font-mono">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Status Indicator */}
      <div className="absolute top-3 right-4">
        <Badge
          variant={isAvailable ? 'success' : isError ? 'destructive' : 'warning'}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium"
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              isAvailable ? 'bg-green-500 animate-pulse' : isError ? 'bg-red-500' : 'bg-yellow-500',
            )}
          />
          {status?.latencyMs ? `${status.latencyMs}ms` : 'N/A'}
        </Badge>
      </div>

      {/* Title & Active Badge */}
      <div className="mb-2 flex flex-col items-center gap-2">
        <h4
          className={`text-lg font-semibold font-sans tracking-tight ${
            isActive ? 'text-primary' : 'text-foreground'
          }`}
        >
          {provider.title}
        </h4>
        {isActive && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary text-primary-foreground">
            ACTIVE
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
        {provider.description}
      </p>

      <div className="mt-auto w-full pt-3 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
          <span>{status?.modelCount ? `${status.modelCount} models` : 'No models'}</span>
          {status?.message && !isAvailable && (
            <span className="text-red-500 max-w-28 truncate" title={status.message}>
              {status.message}
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant={isActive ? 'default' : 'secondary'}
          className="h-8 w-full text-xs shadow-sm"
          onClick={(e) => {
            e.stopPropagation()
            onTest()
          }}
          disabled={isTesting}
        >
          {isTesting ? (
            <IconLoader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <IconPlayerPlay className="mr-1.5 size-3.5 fill-current" />
          )}
          Probar ahora
        </Button>

        {hasDetails && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(!showDetails)
            }}
            className="flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full pt-1"
          >
            {showDetails ? (
              <>
                Ocultar detalles
                <IconChevronUp className="size-3" />
              </>
            ) : (
              <>
                Mostrar detalles
                <IconChevronDown className="size-3" />
              </>
            )}
          </button>
        )}

        {showDetails && hasDetails && (
          <div className="rounded-md border border-border/40 bg-background/50 px-2 py-1.5 text-left space-y-1.5 text-[10px] animate-in fade-in slide-in-from-top-1 duration-200">
            {apiBaseUrl && (
              <div>
                <span className="text-muted-foreground block">
                  {t('settings.ai.fields.apiUrl', 'API URL')}
                </span>
                <span className="block truncate font-mono text-foreground/90">{apiBaseUrl}</span>
              </div>
            )}
            {resolvedModel && (
              <div>
                <span className="text-muted-foreground block">
                  {t('settings.ai.fields.activeModel', 'Active model')}
                </span>
                <span className="block truncate font-mono text-foreground/90">{resolvedModel}</span>
              </div>
            )}
            {testResult && (
              <div className="pt-1 border-t border-border/30">
                <span className="text-muted-foreground block">
                  {t('settings.ai.fields.testResult', 'Test result')}
                </span>
                <span
                  className={cn(
                    'block font-mono font-medium',
                    testResult.ok ? 'text-emerald-500' : 'text-red-500',
                  )}
                >
                  {testResult.message}
                </span>
                <span className="text-[8px] text-muted-foreground/60 block">
                  {new Date(testResult.testedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const AI_CONFIG_TABS = ['status', 'configurations', 'logs'] as const
type AiConfigTab = (typeof AI_CONFIG_TABS)[number]

export function AiConfigForm() {
  const { t } = useTranslation()

  // Nested helper collapsible to capture form and t from closure without using any types
  const AdvancedEndpointsCollapsible = () => {
    const [showAdvanced, setShowAdvanced] = React.useState(false)

    return (
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? (
            <>
              <IconChevronUp className="size-4" />
              Ocultar Endpoints Avanzados
            </>
          ) : (
            <>
              <IconChevronDown className="size-4" />
              Mostrar Endpoints Avanzados
            </>
          )}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <form.Field name="endpoints.chat">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    {t('settings.ai.fields.chatEndpoint')}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-muted/20"
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === 'string' ? e : String(e),
                    )}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="endpoints.models">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    {t('settings.ai.fields.modelsEndpoint')}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="bg-muted/20"
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === 'string' ? e : String(e),
                    )}
                  />
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.provider}>
              {(provider) =>
                ['lm-studio', 'ollama', 'llama-cpp'].includes(provider) ? (
                  <>
                    <form.Field name="endpoints.load">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.loadEndpoint')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="endpoints.download">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.downloadEndpoint')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="endpoints.status">
                      {(field) => (
                        <Field className="sm:col-span-2">
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.statusEndpoint')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </>
                ) : null
              }
            </form.Subscribe>
          </div>
        )}
      </div>
    )
  }
  const [tab, setTab] = useQueryState<AiConfigTab>(
    'tab',
    parseAsStringLiteral(AI_CONFIG_TABS).withDefault('status'),
  )
  const { data: config, isLoading: isConfigLoading } = useAiConfig()
  const { data: configStore } = useAiConfigStore()
  const updateMutation = useUpdateAiConfig()
  const resetMutation = useResetAiConfig()
  const testMutation = useTestAiConnection()
  const { data: providerStatuses } = useAiProviderStatuses()

  const defaultValues: AiConfigFormData = React.useMemo(() => {
    return {
      provider: config?.provider ?? 'lm-studio',
      baseUrl: config?.baseUrl ?? PROVIDER_DEFAULTS['lm-studio'].baseUrl!,
      port: config?.port ?? PROVIDER_DEFAULTS['lm-studio'].port!,
      token: config?.token ?? '',
      apiKey: config?.apiKey ?? '',
      parameters: {
        model: config?.parameters?.model ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.model,
        temperature:
          config?.parameters?.temperature ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.temperature,
        max_tokens:
          config?.parameters?.max_tokens ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.max_tokens,
        top_p: config?.parameters?.top_p ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.top_p,
        frequency_penalty:
          config?.parameters?.frequency_penalty ??
          PROVIDER_DEFAULTS['lm-studio'].parameters!.frequency_penalty,
        presence_penalty:
          config?.parameters?.presence_penalty ??
          PROVIDER_DEFAULTS['lm-studio'].parameters!.presence_penalty,
      },
      endpoints: {
        chat: config?.endpoints?.chat ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.chat,
        models: config?.endpoints?.models ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.models,
        load: config?.endpoints?.load ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.load,
        download: config?.endpoints?.download ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.download,
        status: config?.endpoints?.status ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.status,
      },
      timeout: config?.timeout ?? 30000,
      additionalParams: config?.additionalParams ?? '',
    }
  }, [config])

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync(value)
      } catch {
        // Error handled by mutation and toast
      }
    },
  })

  // Sync form ONLY when the saved config's provider changes (e.g. external
  // change or first arrival). We deliberately don't sync on every refetch,
  // otherwise periodic background refetches (focus / poll / mutation
  // invalidations) would wipe out the user's in-progress edits.
  const lastSyncedProviderRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!config?.provider) return
    if (lastSyncedProviderRef.current === config.provider) return
    lastSyncedProviderRef.current = config.provider

    form.reset({
      provider: config.provider,
      baseUrl: config.baseUrl,
      port: config.port,
      token: config.token ?? '',
      apiKey: config.apiKey ?? '',
      timeout: config.timeout ?? 30000,
      additionalParams: config.additionalParams ?? '',
      parameters: {
        model: config.parameters.model,
        temperature: config.parameters.temperature,
        max_tokens: config.parameters.max_tokens,
        top_p: config.parameters.top_p,
        frequency_penalty: config.parameters.frequency_penalty,
        presence_penalty: config.parameters.presence_penalty,
      },
      endpoints: {
        chat: config.endpoints.chat,
        models: config.endpoints.models,
        load: config.endpoints.load ?? '',
        download: config.endpoints.download ?? '',
        status: config.endpoints.status ?? '',
      },
    })
  }, [config, form])

  const currentProvider = useStore(form.store, (state) => state.values.provider)
  const currentBaseUrl = useStore(form.store, (state) => state.values.baseUrl)
  const currentPort = useStore(form.store, (state) => state.values.port)
  const currentToken = useStore(form.store, (state) => state.values.token)
  const currentApiKey = useStore(form.store, (state) => state.values.apiKey)
  const currentTimeout = useStore(form.store, (state) => state.values.timeout)
  const currentChatEndpoint = useStore(form.store, (state) => state.values.endpoints.chat)
  const currentModelsEndpoint = useStore(form.store, (state) => state.values.endpoints.models)
  const currentLoadEndpoint = useStore(form.store, (state) => state.values.endpoints.load)
  const currentDownloadEndpoint = useStore(form.store, (state) => state.values.endpoints.download)
  const currentStatusEndpoint = useStore(form.store, (state) => state.values.endpoints.status)

  const providerModelConfig: AiConfigFormData = React.useMemo(
    () => ({
      provider: currentProvider,
      baseUrl: currentBaseUrl,
      port: currentPort,
      token: currentToken,
      apiKey: currentApiKey,
      parameters: {
        model: 'auto',
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      endpoints: {
        chat: currentChatEndpoint,
        models: currentModelsEndpoint,
        load: currentLoadEndpoint,
        download: currentDownloadEndpoint,
        status: currentStatusEndpoint,
      },
      timeout: currentTimeout,
      additionalParams: '',
    }),
    [
      currentApiKey,
      currentBaseUrl,
      currentChatEndpoint,
      currentDownloadEndpoint,
      currentLoadEndpoint,
      currentModelsEndpoint,
      currentPort,
      currentProvider,
      currentStatusEndpoint,
      currentTimeout,
      currentToken,
    ],
  )

  const { data: providerModels, isLoading: isModelsLoading } =
    useAiProviderModels(providerModelConfig)
  const [testingProviderId, setTestingProviderId] = React.useState<AiProvider | null>(null)
  const [providerTestResults, setProviderTestResults] = React.useState<
    Partial<Record<AiProvider, { ok: boolean; message: string; testedAt: number }>>
  >({})

  const resolveProviderConfig = React.useCallback(
    (provider: AiProvider): AiConfigFormData => {
      const defaults = PROVIDER_DEFAULTS[provider] ?? PROVIDER_DEFAULTS['lm-studio']
      const saved = configStore?.providers?.[provider]

      return {
        provider,
        baseUrl: saved?.baseUrl ?? defaults.baseUrl!,
        port: saved?.port ?? defaults.port!,
        token: saved?.token ?? '',
        apiKey: saved?.apiKey ?? '',
        endpoints: {
          chat: saved?.endpoints?.chat ?? defaults.endpoints!.chat,
          models: saved?.endpoints?.models ?? defaults.endpoints!.models,
          load: saved?.endpoints?.load ?? defaults.endpoints?.load ?? '',
          download: saved?.endpoints?.download ?? defaults.endpoints?.download ?? '',
          status: saved?.endpoints?.status ?? defaults.endpoints?.status ?? '',
        },
        parameters: {
          model: saved?.parameters?.model ?? defaults.parameters!.model,
          temperature: saved?.parameters?.temperature ?? defaults.parameters!.temperature,
          max_tokens: saved?.parameters?.max_tokens ?? defaults.parameters!.max_tokens,
          top_p: saved?.parameters?.top_p ?? defaults.parameters!.top_p,
          frequency_penalty:
            saved?.parameters?.frequency_penalty ?? defaults.parameters!.frequency_penalty,
          presence_penalty:
            saved?.parameters?.presence_penalty ?? defaults.parameters!.presence_penalty,
        },
        timeout: saved?.timeout ?? 30000,
        additionalParams: saved?.additionalParams ?? '',
      }
    },
    [configStore],
  )

  const handleReset = () => {
    toast.warning(t('settings.ai.actions.confirmReset'), {
      action: {
        label: t('common.confirm'),
        onClick: async () => {
          try {
            await resetMutation.mutateAsync()
            form.reset(defaultValues)
          } catch {
            // Error handled by mutation and toast
          }
        },
      },
      duration: 10000,
    })
  }

  const handleTestConnection = async () => {
    const value = form.state.values
    try {
      const success = await testMutation.mutateAsync(value)
      if (success) {
        toast.success(t('settings.ai.messages.testSuccess'))
      } else {
        toast.error(t('settings.ai.messages.testError'))
      }
    } catch {
      toast.error(t('settings.ai.messages.testError'))
    }
  }

  const handleProviderChange = (provider: AiProvider) => {
    // Radix Select can fire onValueChange('') when the controlled value
    // changes to a value whose SelectItem is not yet registered (closed
    // dropdown). Ignore the spurious empty event so it doesn't wipe the form.
    if (!provider) return
    const nextConfig = resolveProviderConfig(provider)

    form.setFieldValue('provider', nextConfig.provider)
    form.setFieldValue('baseUrl', nextConfig.baseUrl)
    form.setFieldValue('port', nextConfig.port)
    form.setFieldValue('token', nextConfig.token)
    form.setFieldValue('apiKey', nextConfig.apiKey)
    form.setFieldValue('endpoints.chat', nextConfig.endpoints.chat)
    form.setFieldValue('endpoints.models', nextConfig.endpoints.models)
    form.setFieldValue('endpoints.load', nextConfig.endpoints.load)
    form.setFieldValue('endpoints.download', nextConfig.endpoints.download)
    form.setFieldValue('endpoints.status', nextConfig.endpoints.status)
    form.setFieldValue('parameters.model', nextConfig.parameters.model)
    form.setFieldValue('parameters.temperature', nextConfig.parameters.temperature)
    form.setFieldValue('parameters.max_tokens', nextConfig.parameters.max_tokens)
    form.setFieldValue('parameters.top_p', nextConfig.parameters.top_p)
    form.setFieldValue('parameters.frequency_penalty', nextConfig.parameters.frequency_penalty)
    form.setFieldValue('parameters.presence_penalty', nextConfig.parameters.presence_penalty)
    form.setFieldValue('timeout', nextConfig.timeout)
    form.setFieldValue('additionalParams', nextConfig.additionalParams)
  }

  const handleTestProvider = async (provider: AiProvider) => {
    setTestingProviderId(provider)
    try {
      const success = await testMutation.mutateAsync(resolveProviderConfig(provider))
      const message = success
        ? t('settings.ai.messages.testSuccess')
        : t('settings.ai.messages.testError')

      setProviderTestResults((prev) => ({
        ...prev,
        [provider]: {
          ok: success,
          message,
          testedAt: Date.now(),
        },
      }))

      if (success) {
        toast.success(`${provider.toUpperCase()}: ${message}`)
      } else {
        toast.error(`${provider.toUpperCase()}: ${message}`)
      }
    } catch {
      const message = t('settings.ai.messages.testError')
      setProviderTestResults((prev) => ({
        ...prev,
        [provider]: {
          ok: false,
          message,
          testedAt: Date.now(),
        },
      }))
      toast.error(`${provider.toUpperCase()}: ${message}`)
    } finally {
      setTestingProviderId(null)
    }
  }

  if (isConfigLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as AiConfigTab)}
        className="w-full space-y-6"
      >
        <TabsList
          variant="line"
          className="grid w-full grid-cols-3 border-b rounded-none h-auto p-0 bg-transparent"
        >
          <TabsTrigger
            value="status"
            className="rounded-none shadow-none bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2 flex items-center justify-center gap-2"
          >
            <IconWorldCheck className="size-4" />
            {t('settings.ai.sections.status')}
          </TabsTrigger>
          <TabsTrigger
            value="configurations"
            className="rounded-none shadow-none bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2 flex items-center justify-center gap-2"
          >
            <IconSettings className="size-4" />
            {t('settings.ai.sections.configurations') || 'Configurations'}
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="rounded-none shadow-none bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2 flex items-center justify-center gap-2"
          >
            <IconFileText className="size-4" />
            {t('settings.ai.sections.logs') || 'Logs'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="status" className="mt-0">
          {/* Status Section */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
              <div className="flex items-center gap-2">
                <IconWorldCheck className="size-5 text-primary" />
                <h3 className="text-xl font-semibold leading-none tracking-tight">
                  {t('settings.ai.sections.status')} & Priority
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Current system status and intelligent fallback priority sequence.
              </p>
            </div>
            <div className="p-6 pt-0 max-h-[70vh] overflow-y-auto pr-2 md:max-h-none md:overflow-visible">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    id: 'llama-cpp',
                    title: 'Llama.cpp',
                    description:
                      'High-performance inference engine for running LLMs locally on standard hardware.',
                  },
                  {
                    id: 'ollama',
                    title: t('settings.ai.providers.ollama', 'Ollama'),
                    description:
                      'Streamlined local LLM runner supporting Llama 3, Mistral, and other open-source models.',
                  },
                  {
                    id: 'lm-studio',
                    title: 'LM Studio',
                    description:
                      'User-friendly desktop application for discovering, downloading, and running local LLMs.',
                  },
                  {
                    id: 'openai',
                    title: 'OpenAI',
                    description:
                      'Industry-leading GPT-4 models providing state-of-the-art reasoning and generation.',
                  },
                  {
                    id: 'anthropic',
                    title: 'Anthropic',
                    description:
                      'Enterprise-grade Claude models focused on safety, reliability, and large context windows.',
                  },
                  {
                    id: 'minimax',
                    title: 'MiniMax',
                    description:
                      'Hosted multimodal models from MiniMax with OpenAI-compatible API and large context windows.',
                  },
                ].map((provider, index) => {
                  const providerId = provider.id as AiProvider
                  const status = providerStatuses?.find((s) => s?.id === provider.id)
                  const isActive = config?.provider === provider.id
                  const isAvailable = status?.available ?? false
                  const isError = status?.status === 'error' || status?.status === 'unreachable'
                  const providerConfig = configStore?.providers?.[providerId]
                  const providerDefault =
                    PROVIDER_DEFAULTS[providerId] ?? PROVIDER_DEFAULTS['lm-studio']
                  const apiBaseUrl = providerConfig?.baseUrl ?? providerDefault.baseUrl ?? ''
                  const resolvedModel =
                    status?.resolvedModelId ||
                    status?.activeModelId ||
                    providerConfig?.parameters?.model ||
                    'auto'
                  const testResult = providerTestResults[providerId]
                  const isTesting = testingProviderId === providerId

                  return (
                    <ProviderStatusCard
                      key={provider.id}
                      provider={provider}
                      index={index}
                      isActive={isActive}
                      isAvailable={isAvailable}
                      isError={isError}
                      apiBaseUrl={apiBaseUrl}
                      resolvedModel={resolvedModel}
                      status={status}
                      testResult={testResult}
                      isTesting={isTesting}
                      onSelect={() => handleProviderChange(providerId)}
                      onTest={() => handleTestProvider(providerId)}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="configurations" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column: Provider & Connection */}
            <div className="space-y-6">
              {/* Block 1: Provider Card */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <IconSettings className="size-5 text-primary" />
                    <CardTitle className="text-lg font-semibold tracking-tight">
                      {t('settings.ai.fields.provider') || 'Provider'}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    {t('settings.ai.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form.Field name="provider">
                    {(field) => (
                      <Field>
                        <FieldLabel>{t('settings.ai.fields.provider')}</FieldLabel>
                        <Select value={field.state.value} onValueChange={handleProviderChange}>
                          <SelectTrigger className="w-full sm:max-w-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="llama-cpp">
                              {t('settings.ai.providers.llama-cpp', 'Llama.cpp')}
                            </SelectItem>
                            <SelectItem value="ollama">
                              {t('settings.ai.providers.ollama', 'Ollama')}
                            </SelectItem>
                            <SelectItem value="lm-studio">
                              {t('settings.ai.providers.lm-studio')}
                            </SelectItem>
                            <SelectItem value="openai">
                              {t('settings.ai.providers.openai')}
                            </SelectItem>
                            <SelectItem value="anthropic">
                              {t('settings.ai.providers.anthropic')}
                            </SelectItem>
                            <SelectItem value="minimax">
                              {t('settings.ai.providers.minimax')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  </form.Field>
                </CardContent>
              </Card>

              {/* Block 2: Connection Card */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <IconPlugConnected className="size-5 text-primary" />
                    <CardTitle className="text-lg font-semibold tracking-tight">
                      {t('settings.ai.sections.connection') || 'Connection'}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    Configure base endpoints, ports, time limit, and authentication keys.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <form.Field name="baseUrl">
                      {(field) => (
                        <Field className="sm:col-span-3">
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.baseUrl')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="port">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.port')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="timeout">
                      {(field) => (
                        <Field className="sm:col-span-4">
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.timeout')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>

                    <form.Subscribe selector={(state) => state.values.provider}>
                      {(provider) =>
                        ['lm-studio', 'ollama', 'llama-cpp'].includes(provider) ? null : (
                          <form.Field name="token">
                            {(field) => {
                              const tokenPlaceholder =
                                {
                                  openai: 'sk-proj-...',
                                  anthropic: 'sk-ant-...',
                                  minimax: 'eyJhbG... (JWT)',
                                }[provider as 'openai' | 'anthropic' | 'minimax'] ?? 'token-...'

                              return (
                                <Field className="sm:col-span-4">
                                  <FieldLabel htmlFor={field.name}>
                                    {['openai', 'anthropic', 'minimax'].includes(provider)
                                      ? t('settings.ai.fields.apiKey')
                                      : t('settings.ai.fields.token')}
                                  </FieldLabel>
                                  <Input
                                    id={field.name}
                                    type="password"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={tokenPlaceholder}
                                    className="bg-muted/20"
                                  />
                                  <FieldError
                                    errors={field.state.meta.errors.map((e) =>
                                      typeof e === 'string' ? e : String(e),
                                    )}
                                  />
                                </Field>
                              )
                            }}
                          </form.Field>
                        )
                      }
                    </form.Subscribe>
                  </div>

                  <Separator className="my-2 opacity-50" />
                  <AdvancedEndpointsCollapsible />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Parameters & Actions */}
            <div className="space-y-6">
              {/* Block 3: Parameters Card */}
              <Card className="border-border/60 shadow-sm h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <IconAdjustments className="size-5 text-primary" />
                    <CardTitle className="text-lg font-semibold tracking-tight">
                      {t('settings.ai.sections.parameters') || 'Parameters'}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    Fine-tune LLM response generation temperatures, tokens, and custom properties.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <form.Field name="parameters.model">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t('settings.ai.fields.model')}
                        </FieldLabel>
                        <Select
                          value={field.state.value || 'auto'}
                          onValueChange={(value) => field.handleChange(value)}
                        >
                          <SelectTrigger id={field.name} className="w-full bg-muted/20">
                            <SelectValue placeholder={t('settings.ai.fields.model')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">
                              {providerModels?.activeModelId
                                ? `Auto (${providerModels.activeModelId})`
                                : 'Auto'}
                            </SelectItem>
                            {providerModels?.models.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.active ? `${model.label} · active` : model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          {isModelsLoading
                            ? 'Loading models from provider API...'
                            : providerModels?.resolvedModelId
                              ? `Resolved by API: ${providerModels.resolvedModelId}`
                              : 'The model list is discovered from the provider API.'}
                        </p>
                        <FieldError
                          errors={field.state.meta.errors.map((e) =>
                            typeof e === 'string' ? e : String(e),
                          )}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <form.Field name="parameters.temperature">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.temperature')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="parameters.top_p">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.topP')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="parameters.max_tokens">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t('settings.ai.fields.maxTokens')}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          className="bg-muted/20"
                        />
                        <FieldError
                          errors={field.state.meta.errors.map((e) =>
                            typeof e === 'string' ? e : String(e),
                          )}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <form.Field name="parameters.frequency_penalty">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.frequencyPenalty')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            step="0.1"
                            min="-2"
                            max="2"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="parameters.presence_penalty">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t('settings.ai.fields.presencePenalty')}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            step="0.1"
                            min="-2"
                            max="2"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(Number(e.target.value))}
                            className="bg-muted/20"
                          />
                          <FieldError
                            errors={field.state.meta.errors.map((e) =>
                              typeof e === 'string' ? e : String(e),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="additionalParams">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t('settings.ai.fields.additionalParams')}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder='{"key": "value"}'
                          className="bg-muted/20"
                        />
                        <FieldError
                          errors={field.state.meta.errors.map((e) =>
                            typeof e === 'string' ? e : String(e),
                          )}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <Separator className="my-2" />

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="submit"
                      className="w-full shadow-md"
                      disabled={updateMutation.isPending || !form.state.canSubmit}
                    >
                      {updateMutation.isPending ? (
                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <IconDeviceFloppy className="mr-2 size-4" />
                      )}
                      {t('settings.ai.actions.save')}
                    </Button>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestConnection}
                        disabled={testMutation.isPending}
                        className="h-auto w-full flex-1 whitespace-normal py-2 text-xs sm:w-auto"
                      >
                        {testMutation.isPending ? (
                          <IconLoader2 className="mr-1 size-3 animate-spin" />
                        ) : (
                          <IconWorldCheck className="mr-1 size-3" />
                        )}
                        {t('settings.ai.actions.test')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={resetMutation.isPending}
                        className="h-auto w-full flex-1 whitespace-normal py-2 text-xs text-muted-foreground hover:text-destructive sm:w-auto"
                      >
                        <IconRefresh className="mr-1 size-3" />
                        {t('settings.ai.actions.reset')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-0 space-y-4">
          <AiLanguageAudit className="mt-0" />
        </TabsContent>
      </Tabs>
    </form>
  )
}
