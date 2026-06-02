'use client'

import { m, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Code,
  Shield,
  Activity,
  Layers,
  Users,
  Database,
  Lock,
  ChevronRight,
} from 'lucide-react'
import { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useWaveAnimation } from '../hooks/useWaveAnimation'

export function GlowyWavesHero() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'arch' | 'auth' | 'dash'>('arch')

  // Keep wave background animation
  useWaveAnimation({ canvasRef })

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('npx @edd_remonts/create-edd-app my-product')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy text: ', err)
    }
  }, [])

  const handleScrollToServices = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const servicesSection = document.getElementById('services')
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <section
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-background pt-24 pb-16 md:pt-32"
      role="region"
      aria-label="Developer-first hero section"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-60"
        aria-hidden="true"
      />

      {/* Modern gradient blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[150px] dark:bg-primary/[0.08]" />
        <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-accent/[0.03] blur-[120px] dark:bg-accent/[0.06]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center md:px-8 lg:px-12">
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex flex-col items-center"
        >
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-4 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground backdrop-blur-md dark:border-border/60 dark:bg-background/80">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>{t('home.hero.badge', 'MODULAR • TYPED • TESTED • ENV-FIRST')}</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl max-w-4xl">
            {t('home.hero.title', 'Launch SaaS in 1 hour')}
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              {t('home.hero.titleHighlight', 'with production-ready architecture')}
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t(
              'home.hero.description',
              'Avoid rebuilding core primitives. Jump straight into business logic with hybrid authentication, clean route separation, pre-configured Playwright tests, and fully typed modules.',
            )}
          </p>

          {/* Command Copy Action & secondary scroll CTA */}
          <div className="mb-16 flex flex-col items-center justify-center gap-6 w-full max-w-2xl">
            {/* Interactive command console */}
            <div
              id="start"
              className="relative flex items-center justify-between w-full max-w-md md:max-w-lg rounded-xl border border-border/60 bg-muted/80 p-1.5 pl-5 shadow-xs backdrop-blur-md dark:bg-muted/40"
            >
              <code className="text-left text-xs sm:text-sm font-mono text-foreground/90 select-all pr-4 whitespace-nowrap overflow-x-auto scrollbar-none">
                npx @edd_remonts/create-edd-app my-product
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-8 w-8 p-0 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80"
                aria-label="Copy installation command"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              onClick={handleScrollToServices}
              className="group gap-2 rounded-lg text-sm border-border/60 hover:bg-secondary/40 backdrop-blur-sm"
            >
              {t('home.hero.ctaSecondary', 'Explore stack')}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
          </div>

          {/* Tabbed Interactive Visual Mockup / Architecture Map */}
          <div className="w-full max-w-4xl rounded-2xl border border-border/40 bg-card/40 p-1.5 shadow-2xl backdrop-blur-md dark:border-border/60 dark:bg-card/35">
            {/* Tabs Selector Header */}
            <div className="flex border-b border-border/30 bg-muted/20 rounded-t-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('arch')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'arch'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{t('home.hero.tabs.architecture', 'Architecture Map')}</span>
              </button>
              <button
                onClick={() => setActiveTab('auth')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'auth'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{t('home.hero.tabs.auth', 'Auth & Roles UI')}</span>
              </button>
              <button
                onClick={() => setActiveTab('dash')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === 'dash'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>{t('home.hero.tabs.dashboard', 'Dashboard Preview')}</span>
              </button>
            </div>

            {/* Interactive content area */}
            <div className="relative min-h-[360px] p-6 text-left overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'arch' && (
                  <m.div
                    key="arch"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-6 md:grid-cols-3 relative h-full items-center py-4"
                  >
                    {/* App Shell Box */}
                    <div className="rounded-xl border border-border/50 bg-background/80 p-5 shadow-xs relative group hover:border-primary/40 transition-colors">
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">
                          typed
                        </span>
                      </div>
                      <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 p-2 text-primary">
                        <Code className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">App Shell</h4>
                      <p className="text-xs text-muted-foreground">
                        Theme provider, sidebar navigation layouts, dialog systems, responsive
                        layouts.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                          tanstack router
                        </span>
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                          tailwind v4
                        </span>
                      </div>
                    </div>

                    {/* Arrow 1 */}
                    <div className="hidden md:flex justify-center text-muted-foreground/30 absolute left-[31%] top-1/2 -translate-y-1/2">
                      <ChevronRight className="h-6 w-6 animate-pulse" />
                    </div>

                    {/* Domain Modules Box */}
                    <div className="rounded-xl border border-border/50 bg-background/80 p-5 shadow-xs relative group hover:border-primary/40 transition-colors md:translate-x-0">
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          isolated
                        </span>
                      </div>
                      <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 p-2 text-primary">
                        <Layers className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">Domain Modules</h4>
                      <p className="text-xs text-muted-foreground">
                        Users directory, budgets, transactions, settings dashboard, asynchronous SSE
                        AI chat client.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                          decoupled context
                        </span>
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                          SSE stream
                        </span>
                      </div>
                    </div>

                    {/* Arrow 2 */}
                    <div className="hidden md:flex justify-center text-muted-foreground/30 absolute left-[64%] top-1/2 -translate-y-1/2">
                      <ChevronRight className="h-6 w-6 animate-pulse" />
                    </div>

                    {/* Integrations & Database Box */}
                    <div className="rounded-xl border border-border/50 bg-background/80 p-5 shadow-xs relative group hover:border-primary/40 transition-colors">
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                          security
                        </span>
                      </div>
                      <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 p-2 text-primary">
                        <Database className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">Integrations & QA</h4>
                      <p className="text-xs text-muted-foreground">
                        Better Auth, Clerk hooks, Drizzle ORM queries, Playwright and Vitest testing
                        configurations.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                          drizzle
                        </span>
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                          playwright E2E
                        </span>
                      </div>
                    </div>
                  </m.div>
                )}

                {activeTab === 'auth' && (
                  <m.div
                    key="auth"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center items-center py-6"
                  >
                    {/* Mock Authentication Card */}
                    <div className="w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-xl">
                      <div className="mb-6 space-y-1">
                        <h4 className="text-lg font-bold text-foreground">Access Workspace</h4>
                        <p className="text-xs text-muted-foreground">
                          Sign in to your product development sandbox.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                            Email Address
                          </label>
                          <input
                            type="email"
                            disabled
                            placeholder="admin@company.com"
                            className="w-full rounded-md border border-border/60 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                            Password
                          </label>
                          <input
                            type="password"
                            disabled
                            value="••••••••••••••"
                            className="w-full rounded-md border border-border/60 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground"
                          />
                        </div>
                        <Button disabled size="sm" className="w-full text-xs py-1.5 h-auto">
                          Sign in with Email
                        </Button>
                      </div>
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/30"></span>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            or access via
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled
                          className="flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/10 py-1.5 text-[10px] font-medium text-muted-foreground"
                        >
                          <Users className="h-3 w-3" />
                          Social Login
                        </button>
                        <button
                          disabled
                          className="flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-primary/10 py-1.5 text-[10px] font-medium text-primary"
                        >
                          <Shield className="h-3 w-3" />
                          Clerk SSO
                        </button>
                      </div>
                    </div>
                  </m.div>
                )}

                {activeTab === 'dash' && (
                  <m.div
                    key="dash"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl border border-border/50 bg-background/90 p-4 shadow-xl flex flex-col md:flex-row gap-4 h-full"
                  >
                    {/* Sidebar mockup */}
                    <div className="w-full md:w-1/4 border-r border-border/30 pr-2 space-y-1 hidden md:block">
                      <div className="rounded-md bg-primary/10 text-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5" />
                        Dashboard
                      </div>
                      <div className="px-3.5 py-1.5 text-xs text-muted-foreground font-medium flex items-center gap-2 hover:bg-secondary/40 rounded transition-colors">
                        <Users className="h-3.5 w-3.5" />
                        Team Users
                      </div>
                      <div className="px-3.5 py-1.5 text-xs text-muted-foreground font-medium flex items-center gap-2 hover:bg-secondary/40 rounded transition-colors">
                        <Database className="h-3.5 w-3.5" />
                        Transactions
                      </div>
                      <div className="px-3.5 py-1.5 text-xs text-muted-foreground font-medium flex items-center gap-2 hover:bg-secondary/40 rounded transition-colors">
                        <Code className="h-3.5 w-3.5" />
                        Budgets Map
                      </div>
                    </div>

                    {/* Main content mockup */}
                    <div className="flex-1 space-y-4">
                      {/* Metric cards */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            Volume
                          </p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">$12,450.00</p>
                          <span className="text-[8px] text-green-500 font-bold">▲ +12.4%</span>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            Projects
                          </p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">4 Active</p>
                          <span className="text-[8px] text-primary font-bold">In production</span>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">
                            API Latency
                          </p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">48 ms</p>
                          <span className="text-[8px] text-green-500 font-bold">
                            100% operational
                          </span>
                        </div>
                      </div>

                      {/* Mini transactions table */}
                      <div className="rounded-lg border border-border/30 bg-background p-2.5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-foreground">
                            Recent Activity
                          </span>
                          <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold">
                            Auto-sync active
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] border-b border-border/20 pb-1">
                            <span className="text-foreground font-medium">Acme Corp Ltd.</span>
                            <span className="text-muted-foreground">Today, 10:14 AM</span>
                            <span className="font-bold text-foreground">$1,200.00</span>
                            <span className="px-1.5 py-0.2 rounded bg-green-500/10 text-green-500 font-semibold text-[8px]">
                              Approved
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] pb-0.5">
                            <span className="text-foreground font-medium">
                              Global Delivery Inc.
                            </span>
                            <span className="text-muted-foreground">Yesterday, 4:32 PM</span>
                            <span className="font-bold text-foreground">$450.00</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-semibold text-[8px]">
                              Pending
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  )
}
