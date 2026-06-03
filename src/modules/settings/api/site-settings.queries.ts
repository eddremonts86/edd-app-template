import { useTQMutation, useTQuery } from '@/shared/lib/query'
import type { SocialLink } from './site-settings.fn'
import { getSocialLinksFn, updateSocialLinksFn } from './site-settings.fn'

export const siteSettingsKeys = {
  all: ['site-settings'] as const,
  socialLinks: () => [...siteSettingsKeys.all, 'social-links'] as const,
}

export const useSocialLinks = () =>
  useTQuery(siteSettingsKeys.socialLinks(), () => getSocialLinksFn(), { cache: 'standard' })

export const useUpdateSocialLinks = () =>
  useTQMutation(
    ['site-settings', 'update-social-links'],
    (links: SocialLink[]) => updateSocialLinksFn({ data: links }),
    {
      invalidateKeys: [siteSettingsKeys.all],
      successMessage: 'Social links saved.',
    },
  )
