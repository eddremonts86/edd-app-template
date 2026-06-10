'use client'

import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { CheckCircle2, Circle, FileCode, Terminal } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui'
import { SceneHeader } from './SceneHeader'

const DAYS = [
  { id: 'day1', num: 1, command: 'pnpm install && pnpm dev', file: '.env.example' },
  { id: 'day2', num: 2, command: undefined, file: 'src/shared/styles/globals.css' },
  { id: 'day3', num: 3, command: 'pnpm db:generate && pnpm db:migrate', file: 'drizzle.config.ts' },
  { id: 'day4', num: 4, command: 'pnpm routes:inventory', file: 'src/routes/' },
  { id: 'day5', num: 5, command: 'pnpm test:e2e && pnpm build', file: 'docker-compose.yml' },
] as const

const TASKS_PER_DAY = 3
const TOTAL_TASKS = DAYS.length * TASKS_PER_DAY

export function FiveDaysScene() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion() ?? false
  const spineRef = useRef<HTMLDivElement | null>(null)
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({})

  const { scrollYProgress } = useScroll({
    target: spineRef,
    offset: ['start 0.7', 'end 0.5'],
  })
  const spineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  const completedCount = useMemo(
    () => Object.values(checkedTasks).filter(Boolean).length,
    [checkedTasks],
  )
  const progressPercent = Math.round((completedCount / TOTAL_TASKS) * 100)

  const toggleTask = (dayId: string, taskIndex: number) => {
    const key = `${dayId}-${taskIndex}`
    setCheckedTasks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <section
      id="timeline"
      className="relative border-t border-border/20 bg-background px-6 py-24 md:py-32"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <SceneHeader
          eyebrow={t('home.fiveDays.eyebrow', 'Days one to five')}
          title={t('home.fiveDays.title', 'Five days from first commit to production')}
          description={t(
            'home.fiveDays.description',
            'A realistic path, not a countdown. Each day has a goal, a handful of tasks and the exact command to run. Tick them off as you go.',
          )}
        />

        {/* Sticky launch-readiness bar */}
        <div className="z-10 flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-background/85 p-4 backdrop-blur-md md:flex-row md:items-center lg:sticky lg:top-20">
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {t('home.fiveDays.progress.title', 'Launch readiness')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                'home.fiveDays.progress.stats',
                '{{completed}} of {{total}} tasks done ({{percent}}%)',
                {
                  completed: completedCount,
                  total: TOTAL_TASKS,
                  percent: progressPercent,
                },
              )}
            </p>
          </div>
          <div className="w-full max-w-md flex-1">
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {/* Scroll-driven timeline */}
        <div ref={spineRef} className="relative">
          {/* Spine */}
          <div className="absolute bottom-0 left-[19px] top-0 w-px bg-border" aria-hidden="true" />
          <m.div
            style={prefersReducedMotion ? undefined : { scaleY: spineScale }}
            className="absolute bottom-0 left-[19px] top-0 w-px origin-top bg-primary"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-10">
            {DAYS.map((day) => {
              const tasks = t(`home.fiveDays.days.${day.id}.tasks`, {
                returnObjects: true,
              }) as string[]
              const dayDone = tasks.every((_, i) => checkedTasks[`${day.id}-${i}`])

              return (
                <m.article
                  key={day.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="relative pl-14"
                >
                  {/* Node on the spine */}
                  <span
                    className={`absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                      dayDone
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                    aria-hidden="true"
                  >
                    {dayDone ? <CheckCircle2 className="h-5 w-5" /> : day.num}
                  </span>

                  <div className="rounded-2xl border border-border/50 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
                    <div className="mb-4 space-y-1 border-b border-border/20 pb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        {t('home.fiveDays.dayLabel', 'Day {{num}}', { num: day.num })}
                      </span>
                      <h3 className="text-xl font-bold tracking-tight text-foreground">
                        {t(`home.fiveDays.days.${day.id}.title`)}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t(`home.fiveDays.days.${day.id}.subtitle`)}
                      </p>
                    </div>

                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/75">
                      {t('home.fiveDays.tasksLabel', 'Checklist')}
                    </p>
                    <div className="grid gap-2">
                      {tasks.map((task, index) => {
                        const isChecked = !!checkedTasks[`${day.id}-${index}`]
                        return (
                          <button
                            key={task}
                            onClick={() => toggleTask(day.id, index)}
                            className="group flex items-start gap-3 rounded-lg border border-border/40 bg-background/50 p-3 text-left transition-all hover:bg-background"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground" />
                            )}
                            <span
                              className={`text-xs font-medium sm:text-sm ${
                                isChecked ? 'text-muted-foreground line-through' : 'text-foreground'
                              }`}
                            >
                              {task}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <div className="grid gap-3 pt-4 sm:grid-cols-2">
                      {day.command && (
                        <div className="flex flex-col justify-between rounded-lg border border-border/40 bg-muted/40 p-3">
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                            <Terminal className="h-3 w-3" aria-hidden="true" />
                            {t('home.fiveDays.commandLabel', 'Run')}
                          </span>
                          <code className="mt-2 block break-all rounded bg-background/50 p-2 font-mono text-xs leading-tight text-foreground">
                            $ {day.command}
                          </code>
                        </div>
                      )}
                      <div className="flex flex-col justify-between rounded-lg border border-border/40 bg-muted/40 p-3">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                          <FileCode className="h-3 w-3" aria-hidden="true" />
                          {t('home.fiveDays.fileLabel', 'Where to look')}
                        </span>
                        <code className="mt-2 block break-all rounded bg-background/50 p-2 font-mono text-xs leading-tight text-foreground">
                          {day.file}
                        </code>
                      </div>
                    </div>
                  </div>
                </m.article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
