'use client'

import { m, useReducedMotion, type Variants } from 'framer-motion'
import { ChevronRight, Code, Database, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SceneHeader } from './SceneHeader'

// Verbatim tool output — intentionally untranslated.
const TERMINAL_LINES = [
  '$ npx @edd_remonts/create-edd-app my-product',
  '✔ Scaffolding my-product',
  '  ├─ src/modules        12 modules',
  '  ├─ drizzle/           migrations ready',
  '  ├─ e2e/               playwright configured',
  '  └─ .env.example       34 variables documented',
  '✔ Done in 58s — pnpm dev to start',
] as const

const terminalContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.35 } },
}

const terminalLine: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
}

const boxesContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
}

const boxItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

interface ArchBox {
  id: 'appShell' | 'modules' | 'integrations'
  icon: typeof Code
  chips: string[]
}

const ARCH_BOXES: ArchBox[] = [
  { id: 'appShell', icon: Code, chips: ['tanstack router', 'tailwind v4'] },
  { id: 'modules', icon: Layers, chips: ['decoupled context', 'SSE stream'] },
  { id: 'integrations', icon: Database, chips: ['drizzle', 'playwright E2E'] },
]

export function FirstMinuteScene() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion() ?? false

  return (
    <section id="first-minute" className="px-6 py-24 md:py-32">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14">
        <SceneHeader
          eyebrow={t('home.firstMinute.eyebrow', 'Minute one')}
          title={t('home.firstMinute.title', 'One command. A real codebase.')}
          description={t(
            'home.firstMinute.description',
            'Not an empty folder — a typed monolith with twelve modules, migrations and CI hooks, named after your product.',
          )}
        />

        {/* Terminal */}
        <div
          role="img"
          aria-label={t(
            'home.firstMinute.terminalAria',
            'Terminal output of the scaffolding command',
          )}
          className="w-full max-w-2xl overflow-hidden rounded-xl border border-border/60 bg-foreground/[0.03] shadow-lg backdrop-blur-sm dark:bg-background/60"
        >
          <div className="flex items-center gap-1.5 border-b border-border/40 bg-muted/30 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
          </div>
          <m.div
            variants={prefersReducedMotion ? undefined : terminalContainer}
            initial={prefersReducedMotion ? false : 'hidden'}
            whileInView={prefersReducedMotion ? undefined : 'visible'}
            viewport={{ once: true, margin: '-80px' }}
            className="space-y-1 p-5 text-left font-mono text-xs leading-relaxed sm:text-sm"
          >
            {TERMINAL_LINES.map((line, index) => (
              <m.p
                key={line}
                variants={prefersReducedMotion ? undefined : terminalLine}
                className={
                  line.startsWith('$')
                    ? 'text-foreground'
                    : line.startsWith('✔')
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                }
              >
                {line}
                {index === TERMINAL_LINES.length - 1 && (
                  <span
                    className="ml-1 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-primary/80 motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
              </m.p>
            ))}
          </m.div>
        </div>

        {/* Architecture map */}
        <m.div
          variants={boxesContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative grid w-full gap-6 md:grid-cols-3"
        >
          {ARCH_BOXES.map((box, index) => {
            const Icon = box.icon
            return (
              <m.div key={box.id} variants={boxItem} className="relative">
                <div className="group h-full rounded-xl border border-border/50 bg-background/80 p-5 text-left shadow-xs transition-colors hover:border-primary/40">
                  <div className="absolute right-2 top-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {t(`home.firstMinute.boxes.${box.id}.tag`)}
                    </span>
                  </div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 text-sm font-bold text-foreground">
                    {t(`home.firstMinute.boxes.${box.id}.title`)}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t(`home.firstMinute.boxes.${box.id}.description`)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {box.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                {index < ARCH_BOXES.length - 1 && (
                  <div
                    className="absolute -right-[1.4rem] top-1/2 hidden -translate-y-1/2 text-muted-foreground/30 md:block"
                    aria-hidden="true"
                  >
                    <ChevronRight className="h-6 w-6 animate-pulse motion-reduce:animate-none" />
                  </div>
                )}
              </m.div>
            )
          })}
        </m.div>
      </div>
    </section>
  )
}
