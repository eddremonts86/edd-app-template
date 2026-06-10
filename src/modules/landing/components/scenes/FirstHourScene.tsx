'use client'

import { AnimatePresence, m, type Variants } from 'framer-motion'
import {
  Activity,
  Bot,
  Database,
  Layers,
  Layout,
  Lock,
  PanelsTopLeft,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { SceneHeader } from './SceneHeader'

const STACK_ITEMS = [
  { id: 'landing', icon: Layout },
  { id: 'shell', icon: PanelsTopLeft },
  { id: 'auth', icon: Lock },
  { id: 'data', icon: Database },
  { id: 'ai', icon: Bot },
  { id: 'quality', icon: ShieldCheck },
] as const

const gridContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const gridItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

export function FirstHourScene() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'auth' | 'dash'>('auth')

  return (
    <section id="services" className="relative overflow-hidden bg-background px-6 py-24 md:py-32">
      <div
        className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]"
        aria-hidden="true"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14">
        <SceneHeader
          eyebrow={t('home.firstHour.eyebrow', 'Hour one')}
          title={t('home.firstHour.title', 'Sign in to a product that already works')}
          description={t(
            'home.firstHour.description',
            'Before the hour is out you are clicking through your own app: real sign-in, a live dashboard, an AI chat answering over SSE. The screens below are the template, untouched.',
          )}
        />

        {/* Product mockup with tabs */}
        <m.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-4xl rounded-2xl border border-border/40 bg-card/40 p-1.5 shadow-2xl backdrop-blur-md dark:border-border/60 dark:bg-card/35"
        >
          <div className="flex gap-1 rounded-t-xl border-b border-border/30 bg-muted/20 p-1">
            <button
              onClick={() => setActiveTab('auth')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'auth'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('home.firstHour.tabs.auth', 'Sign-in')}</span>
            </button>
            <button
              onClick={() => setActiveTab('dash')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'dash'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('home.firstHour.tabs.dashboard', 'Dashboard')}</span>
            </button>
          </div>

          <div className="relative min-h-[360px] overflow-hidden p-6 text-left">
            <AnimatePresence mode="wait">
              {activeTab === 'auth' && (
                <m.div
                  key="auth"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center py-6"
                >
                  <div className="w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-xl">
                    <div className="mb-6 space-y-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {t('home.firstHour.mock.workspaceTitle', 'Access your workspace')}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          'home.firstHour.mock.workspaceSubtitle',
                          'Sign in to the app you scaffolded an hour ago.',
                        )}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                          {t('home.firstHour.mock.emailLabel', 'Email address')}
                        </label>
                        <input
                          type="email"
                          disabled
                          placeholder={t(
                            'home.firstHour.mock.emailPlaceholder',
                            'admin@company.com',
                          )}
                          className="w-full rounded-md border border-border/60 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">
                          {t('home.firstHour.mock.passwordLabel', 'Password')}
                        </label>
                        <input
                          type="password"
                          disabled
                          value="••••••••••••••"
                          readOnly
                          className="w-full rounded-md border border-border/60 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground"
                        />
                      </div>
                      <Button disabled size="sm" className="h-auto w-full py-1.5 text-xs">
                        {t('home.firstHour.mock.signIn', 'Sign in with email')}
                      </Button>
                    </div>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/30"></span>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t('home.firstHour.mock.orAccessVia', 'or continue with')}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled
                        className="flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/10 py-1.5 text-[10px] font-medium text-muted-foreground"
                      >
                        <Users className="h-3 w-3" aria-hidden="true" />
                        {t('home.firstHour.mock.socialLogin', 'Social login')}
                      </button>
                      <button
                        disabled
                        className="flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-primary/10 py-1.5 text-[10px] font-medium text-primary"
                      >
                        <Shield className="h-3 w-3" aria-hidden="true" />
                        {t('home.firstHour.mock.clerkSSO', 'Clerk SSO')}
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
                  className="flex h-full flex-col gap-4 rounded-xl border border-border/50 bg-background/90 p-4 shadow-xl md:flex-row"
                >
                  <div className="hidden w-full space-y-1 border-r border-border/30 pr-2 md:block md:w-1/4">
                    <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                      <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('home.firstHour.mock.navDashboard', 'Dashboard')}
                    </div>
                    <div className="flex items-center gap-2 rounded px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('home.firstHour.mock.navUsers', 'Users')}
                    </div>
                    <div className="flex items-center gap-2 rounded px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40">
                      <Database className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('home.firstHour.mock.navTransactions', 'Transactions')}
                    </div>
                    <div className="flex items-center gap-2 rounded px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/40">
                      <Layout className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('home.firstHour.mock.navBudgets', 'Budgets')}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                          {t('home.firstHour.mock.volume', 'Volume')}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">$12,450.00</p>
                        <span className="text-[8px] font-bold text-green-500">▲ +12.4%</span>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                          {t('home.firstHour.mock.projects', 'Projects')}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">
                          {t('home.firstHour.mock.projectsValue', '4 active')}
                        </p>
                        <span className="text-[8px] font-bold text-primary">
                          {t('home.firstHour.mock.inProduction', 'In production')}
                        </span>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                          {t('home.firstHour.mock.apiLatency', 'API latency')}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">48 ms</p>
                        <span className="text-[8px] font-bold text-green-500">
                          {t('home.firstHour.mock.operational', '100% operational')}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/30 bg-background p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-foreground">
                          {t('home.firstHour.mock.recentActivity', 'Recent activity')}
                        </span>
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold text-primary">
                          {t('home.firstHour.mock.autoSync', 'Auto-sync on')}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between border-b border-border/20 pb-1 text-[10px]">
                          <span className="font-medium text-foreground">
                            {t('home.firstHour.mock.acme', 'Acme Corp Ltd.')}
                          </span>
                          <span className="text-muted-foreground">
                            {t('home.firstHour.mock.today', 'Today, 10:14 AM')}
                          </span>
                          <span className="font-bold text-foreground">$1,200.00</span>
                          <span className="rounded bg-green-500/10 px-1.5 text-[8px] font-semibold text-green-500">
                            {t('home.firstHour.mock.approved', 'Approved')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-0.5 text-[10px]">
                          <span className="font-medium text-foreground">
                            {t('home.firstHour.mock.globalDelivery', 'Global Delivery Inc.')}
                          </span>
                          <span className="text-muted-foreground">
                            {t('home.firstHour.mock.yesterday', 'Yesterday, 4:32 PM')}
                          </span>
                          <span className="font-bold text-foreground">$450.00</span>
                          <span className="rounded bg-amber-500/10 px-1.5 text-[8px] font-semibold text-amber-500">
                            {t('home.firstHour.mock.pending', 'Pending')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </m.div>

        {/* What's inside */}
        <div className="w-full">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <h3 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {t('home.firstHour.stack.title', "What's inside")}
            </h3>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
              {t(
                'home.firstHour.stack.description',
                'Six pieces you would otherwise build yourself, already wired together.',
              )}
            </p>
          </m.div>

          <m.div
            variants={gridContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {STACK_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <m.div
                  key={item.id}
                  variants={gridItem}
                  className="group h-full rounded-xl border border-border/50 bg-background/70 p-6 text-left transition-colors hover:border-primary/40"
                >
                  <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h4 className="mb-1.5 text-base font-semibold tracking-tight text-foreground">
                    {t(`home.firstHour.stack.items.${item.id}.title`)}
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`home.firstHour.stack.items.${item.id}.description`)}
                  </p>
                </m.div>
              )
            })}
          </m.div>
        </div>
      </div>
    </section>
  )
}
