'use client'

import {
  IconBrandX,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandGithub,
} from '@tabler/icons-react'
import React from 'react'
import type { SocialLink } from '@/modules/settings/api/site-settings.fn'
import { useSocialLinks } from '@/modules/settings/api/site-settings.queries'

const PLATFORM_ICONS: Record<SocialLink['platform'], React.ElementType> = {
  twitter: IconBrandX,
  facebook: IconBrandFacebook,
  instagram: IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  github: IconBrandGithub,
}

export function SocialLinks() {
  const { data: links, isLoading } = useSocialLinks()

  if (isLoading || !links) return null

  const enabled = links.filter((l) => l.enabled && l.href)

  return (
    <div className="mt-4 flex gap-4 sm:mt-0">
      {enabled.map((link) => {
        const Icon = PLATFORM_ICONS[link.platform]
        return (
          <a
            key={link.platform}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label={link.label}
          >
            <Icon className="h-5 w-5" />
          </a>
        )
      })}
    </div>
  )
}
