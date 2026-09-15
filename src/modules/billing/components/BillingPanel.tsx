import { IconCreditCard } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCapability } from '@/modules'
import { createPortalLinkFn, getBillingPanelFn } from '../api/billing.fn'

/**
 * The billing surface.
 *
 * It renders whether or not Stripe is configured — a hidden billing page in
 * production looks identical to a broken deploy, and the operator finds out
 * from a customer (docs/architecture/integration-conventions.md §4.3).
 */
export function BillingPanel() {
  const { t } = useTranslation()
  const { isConfigured } = useCapability('billing')

  const { data, isLoading } = useQuery({
    queryKey: ['billing', 'panel'],
    queryFn: () => getBillingPanelFn(),
    enabled: isConfigured,
  })

  const portal = useMutation({
    mutationFn: () => createPortalLinkFn(),
    onSuccess: (result) => {
      if ('url' in result) window.location.href = result.url
    },
  })

  /**
   * The server fn reports a refusal as `{ error: code }` rather than throwing,
   * so it lands in `onSuccess` and the panel used to drop it — the button did
   * nothing and the only thing left to try was pressing it again.
   *
   * A throw is separate and is not the provider's fault by default: it can be
   * the session expiring or the request never leaving the browser.
   */
  const failureCode = portal.isPending
    ? undefined
    : portal.isError
      ? 'unexpected'
      : portal.data && 'error' in portal.data
        ? portal.data.error
        : undefined

  // A code we have no copy for still says something, the way an unknown status
  // does above, rather than printing an enum at somebody.
  const failureMessage = failureCode
    ? t(`billing.error.${failureCode}`, { defaultValue: t('billing.error.unexpected') })
    : undefined

  const status = data?.summary.status
  const statusKey = status ? `billing.status.${status}` : 'billing.status.none'
  // Stripe may invent a status we have no label for; say "unknown" rather than
  // printing a raw enum at somebody.
  const statusLabel = t(statusKey, { defaultValue: t('billing.status.unknown') })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCreditCard className="size-5 text-primary" />
          {t('billing.title')}
        </CardTitle>
        <CardDescription>{t('billing.description')}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!isConfigured && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{t('billing.unconfigured')}</AlertDescription>
          </Alert>
        )}

        {isConfigured && data && !data.webhookConfigured && (
          <Alert variant="warning">
            <AlertCircle className="size-4" />
            <AlertDescription>{t('billing.webhookMissing')}</AlertDescription>
          </Alert>
        )}

        {isConfigured && (
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={data?.summary.isPaying ? 'success' : 'secondary'}>{statusLabel}</Badge>

            {data?.summary.currentPeriodEnd && (
              <span className="text-muted-foreground text-sm">
                {t(data.summary.cancelAtPeriodEnd ? 'billing.endsOn' : 'billing.renewsOn', {
                  date: new Date(data.summary.currentPeriodEnd).toLocaleDateString(),
                })}
              </span>
            )}
          </div>
        )}

        <div>
          <Button
            onClick={() => portal.mutate()}
            disabled={!isConfigured || isLoading || portal.isPending || !data?.summary.status}
            className="gap-2"
          >
            {portal.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            {t('billing.manage')}
          </Button>
        </div>

        {failureMessage && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{failureMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
