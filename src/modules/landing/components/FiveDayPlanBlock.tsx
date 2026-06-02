'use client'

import { m, AnimatePresence } from 'framer-motion'
import { Calendar, CheckSquare, Terminal, FileCode, CheckCircle2, Circle } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Card, Progress } from '@/components/ui'

interface PlanDay {
  dayNum: number
  titleKey: string
  titleFallback: string
  subtitleKey: string
  subtitleFallback: string
  fileTarget?: string
  command?: string
  tasks: {
    id: string
    textKey: string
    textFallback: string
  }[]
}

export function FiveDayPlanBlock() {
  const { t } = useTranslation()
  const [selectedDay, setSelectedDay] = useState<number>(1)
  
  // Keep track of checked tasks globally (dayNum-taskId)
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({
    '1-clone': true, // Clone step is checked by default to feel started
  })

  const days: PlanDay[] = useMemo(() => [
    {
      dayNum: 1,
      titleKey: 'home.plan.day1.title',
      titleFallback: 'Day 1: Setup & Env',
      subtitleKey: 'home.plan.day1.subtitle',
      subtitleFallback: 'Clone the repository and validate your local environment variables.',
      command: 'pnpm install && pnpm lint',
      fileTarget: '.env.example',
      tasks: [
        { id: 'clone', textKey: 'home.plan.day1.task1', textFallback: 'Clone template repository' },
        { id: 'env', textKey: 'home.plan.day1.task2', textFallback: 'Create local .env copy' },
        { id: 'install', textKey: 'home.plan.day1.task3', textFallback: 'Install packages and verify dev server' },
      ],
    },
    {
      dayNum: 2,
      titleKey: 'home.plan.day2.title',
      titleFallback: 'Day 2: Visual & Tokens',
      subtitleKey: 'home.plan.day2.subtitle',
      subtitleFallback: 'Define your branding palettes and configure App Shell navigation.',
      fileTarget: 'src/shared/styles/globals.css',
      tasks: [
        { id: 'theme', textKey: 'home.plan.day2.task1', textFallback: 'Edit OKLCH branding colors in globals.css' },
        { id: 'logo', textKey: 'home.plan.day2.task2', textFallback: 'Replace default logo components' },
        { id: 'sidebar', textKey: 'home.plan.day2.task3', textFallback: 'Map dashboard navigation entries' },
      ],
    },
    {
      dayNum: 3,
      titleKey: 'home.plan.day3.title',
      titleFallback: 'Day 3: Auth & Database',
      subtitleKey: 'home.plan.day3.subtitle',
      subtitleFallback: 'Wired Better Auth credentials and migrate database tables.',
      command: 'pnpm db:generate && pnpm db:migrate',
      fileTarget: 'drizzle.config.ts',
      tasks: [
        { id: 'auth-keys', textKey: 'home.plan.day3.task1', textFallback: 'Configure AUTH_SECRET in environment' },
        { id: 'schema', textKey: 'home.plan.day3.task2', textFallback: 'Define domain schemas in Drizzle kit' },
        { id: 'migrations', textKey: 'home.plan.day3.task3', textFallback: 'Run migrations to database engine' },
      ],
    },
    {
      dayNum: 4,
      titleKey: 'home.plan.day4.title',
      titleFallback: 'Day 4: Domain Core',
      subtitleKey: 'home.plan.day4.subtitle',
      subtitleFallback: 'Add core routing controllers and plug-in AI chat capabilities.',
      command: 'pnpm routes:inventory',
      fileTarget: 'src/routes/',
      tasks: [
        { id: 'routes', textKey: 'home.plan.day4.task1', textFallback: 'Create custom route handlers under router tree' },
        { id: 'logic', textKey: 'home.plan.day4.task2', textFallback: 'Build dashboard widgets and UI modules' },
        { id: 'ai-stream', textKey: 'home.plan.day4.task3', textFallback: 'Connect SSE AI models in chat panel' },
      ],
    },
    {
      dayNum: 5,
      titleKey: 'home.plan.day5.title',
      titleFallback: 'Day 5: QA & Deployment',
      subtitleKey: 'home.plan.day5.subtitle',
      subtitleFallback: 'Run end-to-end playbooks and configure your container compilation.',
      command: 'pnpm test:e2e && pnpm build',
      fileTarget: 'Dockerfile',
      tasks: [
        { id: 'playwright', textKey: 'home.plan.day5.task1', textFallback: 'Execute E2E mock suites with Playwright' },
        { id: 'prod-build', textKey: 'home.plan.day5.task2', textFallback: 'Run vite production optimizations check' },
        { id: 'docker-up', textKey: 'home.plan.day5.task3', textFallback: 'Boot docker-compose.yml stack validation' },
      ],
    },
  ], [])

  const toggleTask = useCallback((dayNum: number, taskId: string) => {
    const key = `${dayNum}-${taskId}`
    setCheckedTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  // Calculate overall checklist stats
  const totalTasks = useMemo(() => days.reduce((sum, d) => sum + d.tasks.length, 0), [days])
  const completedTasksCount = useMemo(() => {
    return Object.values(checkedTasks).filter(Boolean).length
  }, [checkedTasks])
  const progressPercent = useMemo(() => {
    return Math.round((completedTasksCount / totalTasks) * 100)
  }, [completedTasksCount, totalTasks])

  const currentDayData = useMemo(() => {
    return days.find((d) => d.dayNum === selectedDay) || days[0]
  }, [days, selectedDay])

  return (
    <section className="px-6 py-24 bg-background relative border-t border-border/20">
      <div className="mx-auto max-w-4xl">
        {/* Title */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <Badge className="mb-4" variant="secondary">
            <Calendar className="mr-1 h-3.5 w-3.5" />
            {t('home.plan.badge', '5-DAY ROLLOUT WORKFLOW')}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">
            {t('home.plan.title', '5-Day shipping framework')}
          </h2>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            {t('home.plan.description', 'Get your product fully live with an organized checklist. Stop guessing what step comes next.')}
          </p>
        </m.div>

        {/* Global Progress Bar */}
        <div className="mb-12 bg-muted/30 dark:bg-muted/15 border border-border/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {t('home.plan.progress.title', 'Shipping Readiness')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('home.plan.progress.stats', '{{completed}} of {{total}} tasks checked ({{percent}}%)', {
                completed: completedTasksCount,
                total: totalTasks,
                percent: progressPercent,
              })}
            </p>
          </div>
          <div className="flex-1 max-w-md w-full">
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Plan Container Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Left Days navigation tab list */}
          <div className="flex flex-row md:flex-col gap-2 md:col-span-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {days.map((day) => {
              const dayTasks = day.tasks.map(t => `${day.dayNum}-${t.id}`)
              const dayCompletedCount = dayTasks.filter(k => checkedTasks[k]).length
              const isDayComplete = dayCompletedCount === day.tasks.length

              return (
                <button
                  key={day.dayNum}
                  onClick={() => setSelectedDay(day.dayNum)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs font-semibold uppercase tracking-wider transition-all shrink-0 md:shrink border ${
                    selectedDay === day.dayNum
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border/50 hover:text-foreground hover:border-border'
                  }`}
                >
                  {isDayComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-current flex items-center justify-center text-[8px] font-bold shrink-0">
                      {day.dayNum}
                    </span>
                  )}
                  <span>{t(day.titleKey, day.titleFallback)}</span>
                </button>
              )
            })}
          </div>

          {/* Right Checklist & instructions card */}
          <div className="md:col-span-3">
            <Card className="border border-border/50 bg-card/60 p-6 shadow-lg min-h-[300px] flex flex-col justify-between backdrop-blur-sm">
              <AnimatePresence mode="wait">
                <m.div
                  key={selectedDay}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Card header details */}
                  <div className="space-y-2 border-b border-border/20 pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {t('home.plan.stepLabel', 'Step {{num}} of 5', { num: selectedDay })}
                    </span>
                    <h3 className="text-xl font-bold text-foreground">
                      {t(currentDayData.titleKey, currentDayData.titleFallback)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(currentDayData.subtitleKey, currentDayData.subtitleFallback)}
                    </p>
                  </div>

                  {/* Interactive Checklist checklist */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75 flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" />
                      Verification Tasks
                    </p>
                    <div className="grid gap-2">
                      {currentDayData.tasks.map((task) => {
                        const isChecked = !!checkedTasks[`${selectedDay}-${task.id}`]
                        return (
                          <button
                            key={task.id}
                            onClick={() => toggleTask(selectedDay, task.id)}
                            className="flex items-start text-left gap-3 p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-background transition-all group"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground shrink-0 mt-0.5" />
                            )}
                            <span className={`text-xs sm:text-sm font-medium ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {t(task.textKey, task.textFallback)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Context block: Terminal command / path guidelines */}
                  <div className="grid gap-3 pt-2 sm:grid-cols-2">
                    {currentDayData.command && (
                      <div className="rounded-lg border border-border/40 bg-muted/40 p-3 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Terminal className="h-3 w-3" /> Run Command
                        </span>
                        <code className="text-xs font-mono text-foreground mt-2 block break-all leading-tight bg-background/50 p-2 rounded">
                          $ {currentDayData.command}
                        </code>
                      </div>
                    )}
                    {currentDayData.fileTarget && (
                      <div className="rounded-lg border border-border/40 bg-muted/40 p-3 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <FileCode className="h-3 w-3" /> Target File
                        </span>
                        <code className="text-xs font-mono text-foreground mt-2 block break-all leading-tight bg-background/50 p-2 rounded">
                          {currentDayData.fileTarget}
                        </code>
                      </div>
                    )}
                  </div>
                </m.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
