'use client'

import { m, useReducedMotion, type Variants } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Copy, Sparkles } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useWaveAnimation } from '../../hooks/useWaveAnimation'

const INSTALL_COMMAND = 'npx @edd_remonts/create-edd-app my-product'

const headlineContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.15 } },
}

const headlineLine: Variants = {
  hidden: { opacity: 0, y: '0.6em' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function OpeningScene() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const prefersReducedMotion = useReducedMotion() ?? false

  useWaveAnimation({ canvasRef, prefersReducedMotion })

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy text: ', err)
    }
  }, [])

  const arcStops = [
    { id: 'first-minute', ...getArcCopy(t, 'scaffold') },
    { id: 'services', ...getArcCopy(t, 'app') },
    { id: 'timeline', ...getArcCopy(t, 'production') },
  ]

  return (
    <section
      id="home"
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-background pb-20 pt-24 md:pt-28"
      aria-label={t('home.opening.ariaLabel', 'Introduction: production-ready SaaS template')}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-60"
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[150px] dark:bg-primary/[0.08]" />
        <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-accent/[0.03] blur-[120px] dark:bg-accent/[0.06]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center md:px-8">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-md dark:border-border/60 dark:bg-background/80"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{t('home.opening.badge', 'Modular · Typed · Tested')}</span>
        </m.div>

        <m.h1
          variants={headlineContainer}
          initial="hidden"
          animate="visible"
          className="mb-7 max-w-4xl text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
        >
          <span className="block overflow-hidden">
            <m.span variants={headlineLine} className="block">
              {t('home.opening.title', 'The first week of every SaaS,')}
            </m.span>
          </span>
          <span className="block overflow-hidden">
            <m.span variants={headlineLine} className="block text-primary">
              {t('home.opening.titleHighlight', 'already built.')}
            </m.span>
          </span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mx-auto mb-10 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          {t(
            'home.opening.description',
            'Auth, database, AI, translations and tests come wired. Scaffold a project in a minute, sign into your own dashboard within the hour, and spend the week on your product — not on groundwork.',
          )}
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mb-14 flex w-full max-w-2xl flex-col items-center gap-5"
        >
          <div className="relative flex w-full max-w-md items-center justify-between rounded-xl border border-border/60 bg-muted/80 p-1.5 pl-5 shadow-xs backdrop-blur-md dark:bg-muted/40 md:max-w-lg">
            <code className="scrollbar-none select-all overflow-x-auto whitespace-nowrap pr-4 text-left font-mono text-xs text-foreground/90 sm:text-sm">
              {INSTALL_COMMAND}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground hover:bg-background/80 hover:text-foreground"
              aria-label={t('home.opening.copyCommandAria', 'Copy the install command')}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollToId('services')}
            className="group gap-2 rounded-lg border-border/60 text-sm backdrop-blur-sm hover:bg-secondary/40"
          >
            {t('home.opening.ctaSecondary', "See what's inside")}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Button>
        </m.div>

        {/* Narrative arc: 60 s → 1 h → 5 d */}
        <m.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          aria-label={t('home.opening.arc.ariaLabel', 'What you get, and when')}
          className="w-full max-w-3xl"
        >
          <ul className="grid grid-cols-3 divide-x divide-border/40 rounded-2xl border border-border/40 bg-background/60 backdrop-blur-md dark:border-border/60 dark:bg-background/70">
            {arcStops.map((stop) => (
              <li key={stop.id}>
                <button
                  onClick={() => scrollToId(stop.id)}
                  className="group flex w-full flex-col items-center gap-1 rounded-2xl px-3 py-5 transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:py-6"
                >
                  <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl md:text-4xl">
                    {stop.value}
                  </span>
                  <span className="text-pretty px-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                    {stop.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </m.nav>
      </div>

      {/* Scroll cue */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground"
        aria-hidden="true"
      >
        <span className="text-[11px] uppercase tracking-[0.2em]">
          {t('home.opening.scrollCue', 'Keep scrolling')}
        </span>
        <ChevronDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" />
      </m.div>
    </section>
  )
}

function getArcCopy(t: ReturnType<typeof useTranslation>['t'], stop: string) {
  return {
    value: t(`home.opening.arc.${stop}.value`),
    label: t(`home.opening.arc.${stop}.label`),
  }
}
