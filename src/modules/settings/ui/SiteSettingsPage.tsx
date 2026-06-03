import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconLoader2,
  IconShare,
} from '@tabler/icons-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { SocialLink } from '../api/site-settings.fn'
import { DEFAULT_SOCIAL_LINKS } from '../api/site-settings.fn'
import { useSocialLinks, useUpdateSocialLinks } from '../api/site-settings.queries'

const PLATFORM_ICONS: Record<SocialLink['platform'], React.ElementType> = {
  twitter: IconBrandX,
  facebook: IconBrandFacebook,
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  github: IconBrandGithub,
}

export function SiteSettingsPage() {
  const { t } = useTranslation()
  const { data: savedLinks, isLoading } = useSocialLinks()
  const updateMutation = useUpdateSocialLinks()

  const [links, setLinks] = React.useState<SocialLink[]>(DEFAULT_SOCIAL_LINKS)

  React.useEffect(() => {
    if (savedLinks) setLinks(savedLinks)
  }, [savedLinks])

  function handleToggle(platform: SocialLink['platform'], enabled: boolean) {
    setLinks((prev) => prev.map((l) => (l.platform === platform ? { ...l, enabled } : l)))
  }

  function handleHref(platform: SocialLink['platform'], href: string) {
    setLinks((prev) => prev.map((l) => (l.platform === platform ? { ...l, href } : l)))
  }

  async function handleSave() {
    updateMutation.mutate(links)
  }

  const isDirty = JSON.stringify(links) !== JSON.stringify(savedLinks ?? DEFAULT_SOCIAL_LINKS)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('settings.socialLinks.title')}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t('settings.socialLinks.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconShare className="h-4 w-4 text-primary" />
            {t('settings.socialLinks.title')}
          </CardTitle>
          <CardDescription>{t('settings.socialLinks.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground">
              <IconLoader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t('common.loading')}</span>
            </div>
          ) : (
            links.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform]
              return (
                <div key={link.platform} className="flex items-center gap-4 rounded-lg border p-4">
                  <Icon className="h-5 w-5 shrink-0 text-foreground" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`href-${link.platform}`}>{link.label}</Label>
                    <Input
                      id={`href-${link.platform}`}
                      value={link.href}
                      onChange={(e) => handleHref(link.platform, e.target.value)}
                      placeholder="https://"
                      disabled={!link.enabled}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Switch
                    id={`toggle-${link.platform}`}
                    checked={link.enabled}
                    onCheckedChange={(checked) => handleToggle(link.platform, checked)}
                  />
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty || updateMutation.isPending || isLoading}>
          {updateMutation.isPending ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('settings.actions.saving')}
            </>
          ) : (
            t('settings.actions.save')
          )}
        </Button>
      </div>
    </div>
  )
}
