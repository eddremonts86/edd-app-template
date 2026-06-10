# Cinematic Landing Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the block-based landing with a seven-scene, scroll-choreographed narrative (60 s → 1 h → 5 days) with natively-written copy in EN, ES (usted) and DK (du).

**Architecture:** New scene components under `src/modules/landing/components/scenes/`, composed by `HomePage.tsx`. Old blocks deleted. All copy under a rebuilt `home.*` i18n namespace; the legacy top-level `landing.*` mock namespace is folded into `home.firstHour.mock.*`. Motion via framer-motion (`m`, `useScroll`, `useTransform`, `useReducedMotion`) — no new dependencies.

**Tech Stack:** TanStack Start, React 19, Tailwind v4, framer-motion, i18next, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-10-cinematic-landing-design.md`

---

## File map

| Action | Path                                                                                                                                                                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create | `src/modules/landing/components/scenes/SceneHeader.tsx`                                                                                                                          |
| Create | `src/modules/landing/components/scenes/OpeningScene.tsx`                                                                                                                         |
| Create | `src/modules/landing/components/scenes/FrictionScene.tsx`                                                                                                                        |
| Create | `src/modules/landing/components/scenes/FirstMinuteScene.tsx`                                                                                                                     |
| Create | `src/modules/landing/components/scenes/FirstHourScene.tsx`                                                                                                                       |
| Create | `src/modules/landing/components/scenes/FiveDaysScene.tsx`                                                                                                                        |
| Create | `src/modules/landing/components/scenes/ManifestoScene.tsx`                                                                                                                       |
| Create | `src/modules/landing/components/scenes/ClosingScene.tsx`                                                                                                                         |
| Create | `src/modules/landing/components/scenes/index.ts`                                                                                                                                 |
| Create | `src/modules/landing/__tests__/home-i18n.test.ts`                                                                                                                                |
| Modify | `src/modules/landing/components/HomePage.tsx`                                                                                                                                    |
| Modify | `src/modules/landing/components/index.ts`                                                                                                                                        |
| Modify | `src/modules/landing/components/FooterBlock.tsx` (extract "Back to Top")                                                                                                         |
| Modify | `src/shared/lib/i18n/locales/{en,es,dk}/common.json` (`home` rebuilt, `landing` removed)                                                                                         |
| Delete | `GlowyWavesHero.tsx`, `ComparisonBlock.tsx`, `FeatureCardsBlock.tsx`, `OurServicesSection.tsx`, `FiveDayPlanBlock.tsx`, `ContactBlock.tsx`, `FeatureCard.tsx`, `ServiceCard.tsx` |

`ContactForm.tsx` is **kept untouched** — its keys (`home.contact.form.*`) keep their paths; only locale values change. The closing scene therefore uses the `home.contact` namespace (deviation from spec's `home.closing`, justified by ContactForm reuse).

Anchors: `#services` (FirstHourScene), `#timeline` (FiveDaysScene), `#contact` (ClosingScene), `#first-minute` (FirstMinuteScene), `#friction` (FrictionScene) — ids live on each scene's `<section>`.

---

### Task 1: i18n key smoke test (failing first)

**Files:**

- Create: `src/modules/landing/__tests__/home-i18n.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import dk from '@/shared/lib/i18n/locales/dk/common.json'
import en from '@/shared/lib/i18n/locales/en/common.json'
import es from '@/shared/lib/i18n/locales/es/common.json'

const locales = { en, es, dk } as const

const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)

// One representative key per scene block, plus every dynamic prefix the scenes build.
const REQUIRED_KEYS = [
  'home.opening.badge',
  'home.opening.title',
  'home.opening.titleHighlight',
  'home.opening.description',
  'home.opening.arc.scaffold.value',
  'home.opening.arc.app.label',
  'home.opening.arc.production.label',
  'home.opening.scrollCue',
  'home.friction.title',
  'home.friction.withStarter',
  'home.friction.fromScratch',
  'home.friction.rows.auth.starter',
  'home.friction.rows.architecture.scratch',
  'home.friction.rows.tests.name',
  'home.friction.rows.ai.starter',
  'home.friction.rows.docker.scratch',
  'home.firstMinute.title',
  'home.firstMinute.boxes.appShell.description',
  'home.firstMinute.boxes.modules.tag',
  'home.firstMinute.boxes.integrations.title',
  'home.firstHour.title',
  'home.firstHour.tabs.auth',
  'home.firstHour.mock.signIn',
  'home.firstHour.mock.recentActivity',
  'home.firstHour.stack.title',
  'home.firstHour.stack.items.ai.description',
  'home.firstHour.stack.items.quality.title',
  'home.fiveDays.title',
  'home.fiveDays.progress.stats',
  'home.fiveDays.days.day1.tasks.0',
  'home.fiveDays.days.day3.subtitle',
  'home.fiveDays.days.day5.tasks.2',
  'home.fiveDays.commandLabel',
  'home.manifesto.items.structure.statement',
  'home.manifesto.items.security.proof',
  'home.manifesto.items.longevity.title',
  'home.contact.title',
  'home.contact.form.email.label',
  'home.contact.form.projectType.options.saas',
  'home.contact.form.messages.successTitle',
  'home.contact.aside.github.description',
  'home.contact.aside.updates.title',
  'home.footer.backToTop',
  'home.footer.description',
] as const

describe('landing home namespace', () => {
  for (const [name, locale] of Object.entries(locales)) {
    it(`has every scene key in "${name}"`, () => {
      const missing = REQUIRED_KEYS.filter((key) => {
        const value = getPath(locale, key)
        return typeof value !== 'string' || value.length === 0
      })
      expect(missing).toEqual([])
    })

    it(`has no leftover legacy landing keys in "${name}"`, () => {
      expect(getPath(locale, 'landing')).toBeUndefined()
      expect(getPath(locale, 'home.hero')).toBeUndefined()
      expect(getPath(locale, 'home.comparison')).toBeUndefined()
      expect(getPath(locale, 'home.plan')).toBeUndefined()
      expect(getPath(locale, 'home.services')).toBeUndefined()
      expect(getPath(locale, 'home.features')).toBeUndefined()
    })
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/modules/landing/__tests__/home-i18n.test.ts`
Expected: FAIL — missing keys listed for all three locales.

- [ ] **Step 3: Commit the failing test? No — commit together with Task 2-4 (locales) so main stays green.**

---

### Task 2: English copy

**Files:**

- Modify: `src/shared/lib/i18n/locales/en/common.json`

- [ ] **Step 1: Replace the `home` object and delete the top-level `landing` object.**

First confirm nothing outside the landing module references the legacy keys:

Run: `grep -rn "t('landing\.\|t(\"landing\." src --include='*.tsx' --include='*.ts' | grep -v 'modules/landing'`
Expected: no output. (Hits inside `modules/landing` are in files this plan deletes or rewrites.)

Use a Python snippet (JSON-safe; do not hand-edit 1849 lines):

```bash
python3 - <<'EOF'
import json, collections
path = 'src/shared/lib/i18n/locales/en/common.json'
data = json.load(open(path), object_pairs_hook=collections.OrderedDict)
data.pop('landing', None)
data['home'] = json.loads(open('docs/superpowers/plans/copy/en-home.json').read())
json.dump(data, open(path, 'w'), ensure_ascii=False, indent=2)
open(path, 'a').write('\n')
EOF
```

The executor writes `docs/superpowers/plans/copy/en-home.json` with **exactly** this content (this IS the final English copy):

```json
{
  "opening": {
    "badge": "Modular · Typed · Tested",
    "title": "The first week of every SaaS,",
    "titleHighlight": "already built.",
    "description": "Auth, database, AI, translations and tests come wired. Scaffold a project in a minute, sign into your own dashboard within the hour, and spend the week on your product — not on groundwork.",
    "ariaLabel": "Introduction: production-ready SaaS template",
    "copyCommandAria": "Copy the install command",
    "copiedFeedback": "Copied",
    "ctaSecondary": "See what's inside",
    "scrollCue": "Keep scrolling",
    "arc": {
      "ariaLabel": "What you get, and when",
      "scaffold": { "value": "60 s", "label": "to a running scaffold" },
      "app": { "value": "1 h", "label": "to a working app" },
      "production": { "value": "5 d", "label": "to production" }
    }
  },
  "friction": {
    "eyebrow": "The trade-off",
    "title": "The first weeks always disappear into the same work",
    "description": "Sign-in flows, folder structure, test runners, Docker. None of it makes your product different, and all of it can go wrong. Here is what the template takes off your plate.",
    "withStarter": "With the template",
    "fromScratch": "From scratch",
    "rows": {
      "auth": {
        "name": "Authentication",
        "starter": "Better Auth and Clerk arrive pre-configured. Database sessions work in minutes.",
        "scratch": "A day or two lost to endpoints, JWTs, cookie flags, middleware and user tables."
      },
      "architecture": {
        "name": "Architecture",
        "starter": "Self-contained modules behind one barrel import. New features can't tangle with old ones.",
        "scratch": "A folder layout improvised under deadline, refactored painfully six months in."
      },
      "tests": {
        "name": "Testing",
        "starter": "Vitest and Playwright run out of the box, with smoke tests covering real routes.",
        "scratch": "Hours of config files, runners, database seeding and CI before the first useful test."
      },
      "ai": {
        "name": "AI streaming",
        "starter": "Server-sent events and a chat UI are already built, with five providers to choose from.",
        "scratch": "Hand-rolling chunk parsing, retry logic and streaming state for every provider."
      },
      "docker": {
        "name": "Deployment",
        "starter": "Multi-profile Docker Compose for the app, Postgres and ChromaDB, ready for any VPS.",
        "scratch": "Writing Dockerfiles and compose files by hand, then debugging them in production."
      }
    }
  },
  "firstMinute": {
    "eyebrow": "Minute one",
    "title": "One command. A real codebase.",
    "description": "Not an empty folder — a typed monolith with twelve modules, migrations and CI hooks, named after your product.",
    "terminalAria": "Terminal output of the scaffolding command",
    "boxes": {
      "appShell": {
        "title": "App Shell",
        "tag": "typed",
        "description": "Theme, sidebar navigation, dialogs and responsive layout."
      },
      "modules": {
        "title": "Domain Modules",
        "tag": "isolated",
        "description": "Users, settings, dashboard widgets and a streaming AI chat — each one isolated."
      },
      "integrations": {
        "title": "Integrations & QA",
        "tag": "tested",
        "description": "Better Auth, Drizzle ORM, Playwright and Vitest, configured and talking to each other."
      }
    }
  },
  "firstHour": {
    "eyebrow": "Hour one",
    "title": "Sign in to a product that already works",
    "description": "Before the hour is out you are clicking through your own app: real sign-in, a live dashboard, an AI chat answering over SSE. The screens below are the template, untouched.",
    "tabs": { "auth": "Sign-in", "dashboard": "Dashboard" },
    "mock": {
      "workspaceTitle": "Access your workspace",
      "workspaceSubtitle": "Sign in to the app you scaffolded an hour ago.",
      "emailLabel": "Email address",
      "emailPlaceholder": "admin@company.com",
      "passwordLabel": "Password",
      "signIn": "Sign in with email",
      "orAccessVia": "or continue with",
      "socialLogin": "Social login",
      "clerkSSO": "Clerk SSO",
      "navDashboard": "Dashboard",
      "navUsers": "Users",
      "navTransactions": "Transactions",
      "navBudgets": "Budgets",
      "volume": "Volume",
      "projects": "Projects",
      "projectsValue": "4 active",
      "apiLatency": "API latency",
      "inProduction": "In production",
      "operational": "100% operational",
      "recentActivity": "Recent activity",
      "autoSync": "Auto-sync on",
      "acme": "Acme Corp Ltd.",
      "globalDelivery": "Global Delivery Inc.",
      "today": "Today, 10:14 AM",
      "yesterday": "Yesterday, 4:32 PM",
      "approved": "Approved",
      "pending": "Pending"
    },
    "stack": {
      "title": "What's inside",
      "description": "Six pieces you would otherwise build yourself, already wired together.",
      "items": {
        "landing": {
          "title": "Landing & marketing",
          "description": "This very page: hero, scenes, contact form and footer, all behind translation keys."
        },
        "shell": {
          "title": "App shell",
          "description": "Collapsible sidebar, topbar, theming and toasts, responsive from the start."
        },
        "auth": {
          "title": "Authentication",
          "description": "Better Auth with database sessions, plus optional Clerk SSO."
        },
        "data": {
          "title": "Data layer",
          "description": "Drizzle ORM over Postgres, with typed schemas and one-command migrations."
        },
        "ai": {
          "title": "AI module",
          "description": "Five providers, one client: OpenAI, Anthropic, Ollama, LM Studio and llama.cpp — with RAG via ChromaDB."
        },
        "quality": {
          "title": "Quality gates",
          "description": "Type checks, ESLint, Prettier, i18n parity and tests behind a single validate command."
        }
      }
    }
  },
  "fiveDays": {
    "eyebrow": "Days one to five",
    "title": "Five days from first commit to production",
    "description": "A realistic path, not a countdown. Each day has a goal, a handful of tasks and the exact command to run. Tick them off as you go.",
    "dayLabel": "Day {{num}}",
    "tasksLabel": "Checklist",
    "commandLabel": "Run",
    "fileLabel": "Where to look",
    "progress": {
      "title": "Launch readiness",
      "stats": "{{completed}} of {{total}} tasks done ({{percent}}%)"
    },
    "days": {
      "day1": {
        "title": "Environment",
        "subtitle": "Clone the repository, copy the example env file and check that the dev server boots.",
        "tasks": [
          "Clone the template repository",
          "Copy .env.example to .env",
          "Install dependencies and open the dev server"
        ]
      },
      "day2": {
        "title": "Brand",
        "subtitle": "Make it yours: colors, logo and navigation.",
        "tasks": [
          "Adjust the OKLCH palette in globals.css",
          "Replace the default logo",
          "Rename the dashboard navigation entries"
        ]
      },
      "day3": {
        "title": "Auth & data",
        "subtitle": "Wire your credentials and shape the database.",
        "tasks": [
          "Set AUTH_SECRET in your environment",
          "Define your domain schema with Drizzle",
          "Generate and run the migrations"
        ]
      },
      "day4": {
        "title": "Your product",
        "subtitle": "The fun part: routes, widgets and AI for your actual domain.",
        "tasks": [
          "Add your routes under the router tree",
          "Build your first dashboard widgets",
          "Point the AI chat at your provider"
        ]
      },
      "day5": {
        "title": "Ship",
        "subtitle": "Prove it works, then put it in front of people.",
        "tasks": [
          "Run the Playwright end-to-end suite",
          "Build the production bundle",
          "Bring up the Docker Compose stack"
        ]
      }
    }
  },
  "manifesto": {
    "eyebrow": "Why it holds up",
    "items": {
      "structure": {
        "title": "Structure",
        "statement": "Every feature lives in its own module, behind one import.",
        "proof": "Twelve modules ship today. Deleting one doesn't break the others."
      },
      "security": {
        "title": "Security",
        "statement": "Auth, roles and configuration are decided before your first feature — not after your first incident.",
        "proof": "Better Auth sessions, RBAC and typed env access come wired."
      },
      "longevity": {
        "title": "Longevity",
        "statement": "Swap the brand, the modules and the copy. The architecture is built to outlive them.",
        "proof": "This landing is itself a module you could replace this afternoon."
      }
    }
  },
  "contact": {
    "title": "Questions before you clone?",
    "description": "Write to us about the template — a setup problem, a missing feature, an architectural doubt. Your message lands in the same contact-messages module that ships with the starter.",
    "responseNote": "We usually answer within a couple of days.",
    "form": {
      "email": { "label": "Email", "placeholder": "you@company.com" },
      "projectType": {
        "label": "Topic",
        "placeholder": "Pick a topic",
        "options": {
          "saas": "SaaS product",
          "landing": "Marketing site",
          "webapp": "Internal tool"
        }
      },
      "message": {
        "label": "Your message",
        "placeholder": "What are you building, and where can we help?"
      },
      "submit": "Send message",
      "messages": {
        "successTitle": "Message sent",
        "successDescription": "Thanks for writing. It's in our inbox — and in the demo dashboard.",
        "errorTitle": "Could not send",
        "errorDescription": "Please try again in a moment."
      }
    },
    "aside": {
      "github": {
        "title": "Open repository",
        "description": "Bugs and feature requests live as GitHub issues. The roadmap is public.",
        "cta": "Open GitHub"
      },
      "async": {
        "title": "Async by default",
        "description": "No calls, no meetings. Write when it suits you; we answer the same way."
      },
      "updates": {
        "title": "Low-volume updates",
        "description": "Release notes land in your inbox at most once a month."
      }
    }
  },
  "footer": {
    "brand": "edd Starter",
    "since": "The base for what's next",
    "copyright": "© {{year}} edd. All rights reserved.",
    "description": "One foundation for every edd product: same quality, same conventions, faster delivery.",
    "backToTop": "Back to top",
    "subscribe": {
      "title": "Starter updates",
      "placeholder": "you@company.com",
      "button": "Subscribe",
      "note": "Release notes and shipping tips. At most one email a month."
    },
    "links": {
      "essence": {
        "title": "Starter",
        "items": ["Architecture", "Module map", "Design tokens", "Conventions"]
      },
      "company": {
        "title": "Product",
        "items": ["Roadmap", "Changelog", "Integrations", "Release notes"]
      },
      "community": {
        "title": "Support",
        "items": ["Documentation", "Guides", "Examples", "FAQ"]
      },
      "legal": {
        "title": "Legal",
        "items": ["Privacy", "Terms", "Cookies", "Licenses"]
      }
    }
  }
}
```

- [ ] **Step 2: Re-run the smoke test** — `pnpm vitest run src/modules/landing/__tests__/home-i18n.test.ts` — EN assertions pass, ES/DK still fail.

---

### Task 3: Spanish copy (usted)

**Files:**

- Modify: `src/shared/lib/i18n/locales/es/common.json` (same Python pattern as Task 2, source `docs/superpowers/plans/copy/es-home.json`)

- [ ] **Step 1: Write `es-home.json` with exactly this content:**

```json
{
  "opening": {
    "badge": "Modular · Tipado · Probado",
    "title": "La primera semana de cualquier SaaS,",
    "titleHighlight": "ya construida.",
    "description": "La autenticación, la base de datos, la IA, las traducciones y los tests ya vienen conectados. Genere el proyecto en un minuto, entre en su propio dashboard en menos de una hora y dedique la semana a su producto, no a los cimientos.",
    "ariaLabel": "Introducción: plantilla SaaS lista para producción",
    "copyCommandAria": "Copiar el comando de instalación",
    "copiedFeedback": "Copiado",
    "ctaSecondary": "Vea qué incluye",
    "scrollCue": "Siga bajando",
    "arc": {
      "ariaLabel": "Qué obtiene y cuándo",
      "scaffold": { "value": "60 s", "label": "para un proyecto en marcha" },
      "app": { "value": "1 h", "label": "para una app funcional" },
      "production": { "value": "5 d", "label": "para producción" }
    }
  },
  "friction": {
    "eyebrow": "El costo oculto",
    "title": "Las primeras semanas desaparecen siempre en el mismo trabajo",
    "description": "Flujos de acceso, estructura de carpetas, runners de tests, Docker. Nada de eso diferencia su producto y todo puede salir mal. Esto es lo que la plantilla le quita de encima.",
    "withStarter": "Con la plantilla",
    "fromScratch": "Desde cero",
    "rows": {
      "auth": {
        "name": "Autenticación",
        "starter": "Better Auth y Clerk llegan preconfigurados. Las sesiones en base de datos funcionan en minutos.",
        "scratch": "Uno o dos días perdidos entre endpoints, JWT, cookies, middleware y tablas de usuarios."
      },
      "architecture": {
        "name": "Arquitectura",
        "starter": "Módulos autocontenidos tras un único punto de importación. Lo nuevo no se enreda con lo viejo.",
        "scratch": "Una estructura de carpetas improvisada bajo presión, refactorizada con dolor a los seis meses."
      },
      "tests": {
        "name": "Pruebas",
        "starter": "Vitest y Playwright funcionan desde el primer momento, con pruebas de humo sobre rutas reales.",
        "scratch": "Horas de configuración, runners, seeds de base de datos y CI antes del primer test útil."
      },
      "ai": {
        "name": "Streaming de IA",
        "starter": "El streaming por SSE y la interfaz de chat ya están construidos, con cinco proveedores disponibles.",
        "scratch": "Programar a mano el parseo de chunks, los reintentos y el estado del streaming para cada proveedor."
      },
      "docker": {
        "name": "Despliegue",
        "starter": "Docker Compose multiperfil para la app, Postgres y ChromaDB, listo para cualquier VPS.",
        "scratch": "Escribir Dockerfiles y archivos compose a mano y depurarlos ya en producción."
      }
    }
  },
  "firstMinute": {
    "eyebrow": "El primer minuto",
    "title": "Un comando. Una base de código real.",
    "description": "No es una carpeta vacía: es un monolito tipado con doce módulos, migraciones y hooks de CI, con el nombre de su producto.",
    "terminalAria": "Salida de terminal del comando de creación",
    "boxes": {
      "appShell": {
        "title": "App Shell",
        "tag": "tipado",
        "description": "Tema, navegación lateral, diálogos y layout adaptable."
      },
      "modules": {
        "title": "Módulos de dominio",
        "tag": "aislado",
        "description": "Usuarios, ajustes, widgets del dashboard y un chat de IA en streaming, cada uno aislado."
      },
      "integrations": {
        "title": "Integraciones y QA",
        "tag": "probado",
        "description": "Better Auth, Drizzle ORM, Playwright y Vitest, configurados y conectados entre sí."
      }
    }
  },
  "firstHour": {
    "eyebrow": "La primera hora",
    "title": "Entre en un producto que ya funciona",
    "description": "Antes de que pase una hora estará navegando por su propia aplicación: acceso real, un dashboard con datos y un chat de IA respondiendo por SSE. Las pantallas de abajo son la plantilla, sin retocar.",
    "tabs": { "auth": "Acceso", "dashboard": "Dashboard" },
    "mock": {
      "workspaceTitle": "Acceda a su espacio de trabajo",
      "workspaceSubtitle": "Entre en la app que generó hace una hora.",
      "emailLabel": "Correo electrónico",
      "emailPlaceholder": "admin@empresa.com",
      "passwordLabel": "Contraseña",
      "signIn": "Entrar con correo",
      "orAccessVia": "o continúe con",
      "socialLogin": "Acceso social",
      "clerkSSO": "SSO de Clerk",
      "navDashboard": "Panel",
      "navUsers": "Usuarios",
      "navTransactions": "Transacciones",
      "navBudgets": "Presupuestos",
      "volume": "Volumen",
      "projects": "Proyectos",
      "projectsValue": "4 activos",
      "apiLatency": "Latencia de API",
      "inProduction": "En producción",
      "operational": "100 % operativo",
      "recentActivity": "Actividad reciente",
      "autoSync": "Sincronización activa",
      "acme": "Acme Corp, S. L.",
      "globalDelivery": "Global Delivery Inc.",
      "today": "Hoy, 10:14",
      "yesterday": "Ayer, 16:32",
      "approved": "Aprobada",
      "pending": "Pendiente"
    },
    "stack": {
      "title": "Qué incluye",
      "description": "Seis piezas que de otro modo construiría usted mismo, ya conectadas entre sí.",
      "items": {
        "landing": {
          "title": "Landing y marketing",
          "description": "Esta misma página: hero, escenas, formulario de contacto y footer, todo tras claves de traducción."
        },
        "shell": {
          "title": "App shell",
          "description": "Barra lateral plegable, barra superior, temas y avisos, adaptable desde el principio."
        },
        "auth": {
          "title": "Autenticación",
          "description": "Better Auth con sesiones en base de datos y SSO de Clerk opcional."
        },
        "data": {
          "title": "Capa de datos",
          "description": "Drizzle ORM sobre Postgres, con esquemas tipados y migraciones con un solo comando."
        },
        "ai": {
          "title": "Módulo de IA",
          "description": "Cinco proveedores, un solo cliente: OpenAI, Anthropic, Ollama, LM Studio y llama.cpp, con RAG sobre ChromaDB."
        },
        "quality": {
          "title": "Control de calidad",
          "description": "Type-check, ESLint, Prettier, paridad de traducciones y tests tras un único comando de validación."
        }
      }
    }
  },
  "fiveDays": {
    "eyebrow": "Del día uno al cinco",
    "title": "Cinco días del primer commit a producción",
    "description": "Un camino realista, no una cuenta atrás. Cada día tiene un objetivo, unas pocas tareas y el comando exacto que ejecutar. Vaya marcándolas a medida que avance.",
    "dayLabel": "Día {{num}}",
    "tasksLabel": "Lista de tareas",
    "commandLabel": "Ejecute",
    "fileLabel": "Dónde mirar",
    "progress": {
      "title": "Preparación del lanzamiento",
      "stats": "{{completed}} de {{total}} tareas hechas ({{percent}} %)"
    },
    "days": {
      "day1": {
        "title": "Entorno",
        "subtitle": "Clone el repositorio, copie el archivo de entorno de ejemplo y compruebe que el servidor de desarrollo arranca.",
        "tasks": [
          "Clonar el repositorio de la plantilla",
          "Copiar .env.example a .env",
          "Instalar dependencias y abrir el servidor de desarrollo"
        ]
      },
      "day2": {
        "title": "Marca",
        "subtitle": "Hágala suya: colores, logo y navegación.",
        "tasks": [
          "Ajustar la paleta OKLCH en globals.css",
          "Sustituir el logo por defecto",
          "Renombrar las entradas de navegación del dashboard"
        ]
      },
      "day3": {
        "title": "Auth y datos",
        "subtitle": "Configure sus credenciales y dé forma a la base de datos.",
        "tasks": [
          "Definir AUTH_SECRET en el entorno",
          "Modelar el esquema de dominio con Drizzle",
          "Generar y ejecutar las migraciones"
        ]
      },
      "day4": {
        "title": "Su producto",
        "subtitle": "La parte divertida: rutas, widgets e IA para su dominio real.",
        "tasks": [
          "Añadir sus rutas al árbol del router",
          "Construir los primeros widgets del dashboard",
          "Apuntar el chat de IA a su proveedor"
        ]
      },
      "day5": {
        "title": "Lanzamiento",
        "subtitle": "Demuestre que funciona y póngalo delante de la gente.",
        "tasks": [
          "Ejecutar la suite E2E de Playwright",
          "Compilar el build de producción",
          "Levantar el stack de Docker Compose"
        ]
      }
    }
  },
  "manifesto": {
    "eyebrow": "Por qué se sostiene",
    "items": {
      "structure": {
        "title": "Estructura",
        "statement": "Cada función vive en su propio módulo, tras una única importación.",
        "proof": "Hoy se incluyen doce módulos. Borrar uno no rompe los demás."
      },
      "security": {
        "title": "Seguridad",
        "statement": "La autenticación, los roles y la configuración se deciden antes de la primera función, no después del primer incidente.",
        "proof": "Las sesiones de Better Auth, el RBAC y el acceso tipado al entorno ya vienen conectados."
      },
      "longevity": {
        "title": "Durabilidad",
        "statement": "Cambie la marca, los módulos y los textos. La arquitectura está hecha para sobrevivirlos.",
        "proof": "Esta landing es, en sí misma, un módulo que podría reemplazar esta tarde."
      }
    }
  },
  "contact": {
    "title": "¿Dudas antes de clonar?",
    "description": "Escríbanos sobre la plantilla: un problema de instalación, una función que eche en falta, una duda de arquitectura. Su mensaje llega al mismo módulo contact-messages que se incluye con el starter.",
    "responseNote": "Solemos responder en un par de días.",
    "form": {
      "email": { "label": "Correo electrónico", "placeholder": "usted@empresa.com" },
      "projectType": {
        "label": "Tema",
        "placeholder": "Elija un tema",
        "options": {
          "saas": "Producto SaaS",
          "landing": "Sitio de marketing",
          "webapp": "Herramienta interna"
        }
      },
      "message": {
        "label": "Su mensaje",
        "placeholder": "¿Qué está construyendo y en qué podemos ayudarle?"
      },
      "submit": "Enviar mensaje",
      "messages": {
        "successTitle": "Mensaje enviado",
        "successDescription": "Gracias por escribir. Ya está en nuestra bandeja y en el dashboard de demostración.",
        "errorTitle": "No se pudo enviar",
        "errorDescription": "Inténtelo de nuevo en un momento."
      }
    },
    "aside": {
      "github": {
        "title": "Repositorio abierto",
        "description": "Los errores y las peticiones se gestionan como issues de GitHub. El roadmap es público.",
        "cta": "Abrir GitHub"
      },
      "async": {
        "title": "Asíncrono por defecto",
        "description": "Sin llamadas ni reuniones. Escriba cuando le convenga; respondemos de la misma manera."
      },
      "updates": {
        "title": "Novedades sin ruido",
        "description": "Las notas de versión llegan a su correo como mucho una vez al mes."
      }
    }
  },
  "footer": {
    "brand": "edd Starter",
    "since": "La base de lo que viene",
    "copyright": "© {{year}} edd. Todos los derechos reservados.",
    "description": "Una sola base para cada producto edd: la misma calidad, las mismas convenciones y entregas más rápidas.",
    "backToTop": "Volver arriba",
    "subscribe": {
      "title": "Novedades del starter",
      "placeholder": "usted@empresa.com",
      "button": "Suscribirse",
      "note": "Notas de versión y consejos para lanzar. Como mucho, un correo al mes."
    },
    "links": {
      "essence": {
        "title": "Starter",
        "items": ["Arquitectura", "Mapa de módulos", "Tokens de diseño", "Convenciones"]
      },
      "company": {
        "title": "Producto",
        "items": ["Hoja de ruta", "Changelog", "Integraciones", "Notas de versión"]
      },
      "community": {
        "title": "Soporte",
        "items": ["Documentación", "Guías", "Ejemplos", "Preguntas frecuentes"]
      },
      "legal": {
        "title": "Legal",
        "items": ["Privacidad", "Términos", "Cookies", "Licencias"]
      }
    }
  }
}
```

- [ ] **Step 2: Apply with the Python snippet (es path), re-run smoke test** — ES assertions pass.

---

### Task 4: Danish copy (du)

**Files:**

- Modify: `src/shared/lib/i18n/locales/dk/common.json` (same pattern, source `docs/superpowers/plans/copy/dk-home.json`)

- [ ] **Step 1: Write `dk-home.json` with exactly this content:**

```json
{
  "opening": {
    "badge": "Modulær · Typet · Testet",
    "title": "Den første uge af enhver SaaS,",
    "titleHighlight": "allerede bygget.",
    "description": "Auth, database, AI, oversættelser og tests er koblet til fra start. Generér projektet på et minut, log ind på dit eget dashboard inden for en time, og brug ugen på dit produkt — ikke på grundarbejdet.",
    "ariaLabel": "Introduktion: produktionsklar SaaS-skabelon",
    "copyCommandAria": "Kopiér installationskommandoen",
    "copiedFeedback": "Kopieret",
    "ctaSecondary": "Se hvad der følger med",
    "scrollCue": "Scroll videre",
    "arc": {
      "ariaLabel": "Hvad du får, og hvornår",
      "scaffold": { "value": "60 s", "label": "til et kørende projekt" },
      "app": { "value": "1 t", "label": "til en fungerende app" },
      "production": { "value": "5 d", "label": "til produktion" }
    }
  },
  "friction": {
    "eyebrow": "Den skjulte pris",
    "title": "De første uger forsvinder altid i det samme arbejde",
    "description": "Login-flows, mappestruktur, testrunnere, Docker. Intet af det gør dit produkt anderledes, og det hele kan gå galt. Her er, hvad skabelonen klarer for dig.",
    "withStarter": "Med skabelonen",
    "fromScratch": "Fra bunden",
    "rows": {
      "auth": {
        "name": "Autentificering",
        "starter": "Better Auth og Clerk er sat op på forhånd. Databasesessioner virker på få minutter.",
        "scratch": "En dag eller to tabt på endpoints, JWT'er, cookie-flags, middleware og brugertabeller."
      },
      "architecture": {
        "name": "Arkitektur",
        "starter": "Selvstændige moduler bag én samlet import. Nyt kode vikler sig ikke ind i gammelt.",
        "scratch": "En mappestruktur improviseret under deadline — og smertefuldt refaktoreret et halvt år senere."
      },
      "tests": {
        "name": "Test",
        "starter": "Vitest og Playwright kører fra start, med røgtests på rigtige ruter.",
        "scratch": "Timer med konfigurationsfiler, runnere, database-seeding og CI før den første brugbare test."
      },
      "ai": {
        "name": "AI-streaming",
        "starter": "SSE-streaming og chat-UI er allerede bygget, med fem udbydere at vælge imellem.",
        "scratch": "Håndskrevet chunk-parsing, retry-logik og streaming-state for hver eneste udbyder."
      },
      "docker": {
        "name": "Deployment",
        "starter": "Docker Compose med flere profiler til app, Postgres og ChromaDB — klar til enhver VPS.",
        "scratch": "Dockerfiles og compose-filer skrevet i hånden — og fejlsøgt i produktion."
      }
    }
  },
  "firstMinute": {
    "eyebrow": "Det første minut",
    "title": "Én kommando. En rigtig kodebase.",
    "description": "Ikke en tom mappe — en typet monolit med tolv moduler, migreringer og CI-hooks, opkaldt efter dit produkt.",
    "terminalAria": "Terminaloutput fra scaffolding-kommandoen",
    "boxes": {
      "appShell": {
        "title": "App Shell",
        "tag": "typet",
        "description": "Tema, sidebar-navigation, dialoger og responsivt layout."
      },
      "modules": {
        "title": "Domænemoduler",
        "tag": "isoleret",
        "description": "Brugere, indstillinger, dashboard-widgets og en streamende AI-chat — hver for sig isoleret."
      },
      "integrations": {
        "title": "Integrationer & QA",
        "tag": "testet",
        "description": "Better Auth, Drizzle ORM, Playwright og Vitest — konfigureret og forbundet med hinanden."
      }
    }
  },
  "firstHour": {
    "eyebrow": "Den første time",
    "title": "Log ind på et produkt, der allerede virker",
    "description": "Inden timen er omme, klikker du rundt i din egen app: rigtigt login, et levende dashboard og en AI-chat, der svarer over SSE. Skærmene herunder er skabelonen — urørt.",
    "tabs": { "auth": "Login", "dashboard": "Dashboard" },
    "mock": {
      "workspaceTitle": "Adgang til dit workspace",
      "workspaceSubtitle": "Log ind i den app, du genererede for en time siden.",
      "emailLabel": "E-mailadresse",
      "emailPlaceholder": "admin@firma.dk",
      "passwordLabel": "Adgangskode",
      "signIn": "Log ind med e-mail",
      "orAccessVia": "eller fortsæt med",
      "socialLogin": "Socialt login",
      "clerkSSO": "Clerk SSO",
      "navDashboard": "Dashboard",
      "navUsers": "Brugere",
      "navTransactions": "Transaktioner",
      "navBudgets": "Budgetter",
      "volume": "Volumen",
      "projects": "Projekter",
      "projectsValue": "4 aktive",
      "apiLatency": "API-latenstid",
      "inProduction": "I produktion",
      "operational": "100 % oppetid",
      "recentActivity": "Seneste aktivitet",
      "autoSync": "Auto-synk slået til",
      "acme": "Acme Corp ApS",
      "globalDelivery": "Global Delivery Inc.",
      "today": "I dag kl. 10.14",
      "yesterday": "I går kl. 16.32",
      "approved": "Godkendt",
      "pending": "Afventer"
    },
    "stack": {
      "title": "Hvad der følger med",
      "description": "Seks dele, du ellers selv skulle bygge — allerede forbundet med hinanden.",
      "items": {
        "landing": {
          "title": "Landing & marketing",
          "description": "Denne side: hero, scener, kontaktformular og footer — alt sammen bag oversættelsesnøgler."
        },
        "shell": {
          "title": "App shell",
          "description": "Sammenklappelig sidebar, topbar, temaer og toasts — responsivt fra start."
        },
        "auth": {
          "title": "Autentificering",
          "description": "Better Auth med databasesessioner plus valgfri Clerk SSO."
        },
        "data": {
          "title": "Datalag",
          "description": "Drizzle ORM oven på Postgres, med typede skemaer og migreringer med én kommando."
        },
        "ai": {
          "title": "AI-modul",
          "description": "Fem udbydere, én klient: OpenAI, Anthropic, Ollama, LM Studio og llama.cpp — med RAG via ChromaDB."
        },
        "quality": {
          "title": "Kvalitetstjek",
          "description": "Typecheck, ESLint, Prettier, oversættelsesparitet og tests bag én enkelt validate-kommando."
        }
      }
    }
  },
  "fiveDays": {
    "eyebrow": "Dag et til fem",
    "title": "Fem dage fra første commit til produktion",
    "description": "En realistisk plan, ikke en nedtælling. Hver dag har et mål, en håndfuld opgaver og den præcise kommando, du skal køre. Sæt flueben undervejs.",
    "dayLabel": "Dag {{num}}",
    "tasksLabel": "Tjekliste",
    "commandLabel": "Kør",
    "fileLabel": "Her skal du kigge",
    "progress": {
      "title": "Klar til lancering",
      "stats": "{{completed}} af {{total}} opgaver udført ({{percent}} %)"
    },
    "days": {
      "day1": {
        "title": "Miljø",
        "subtitle": "Klon repositoriet, kopiér eksempelfilen med miljøvariabler, og tjek at udviklingsserveren starter.",
        "tasks": [
          "Klon skabelonens repositorium",
          "Kopiér .env.example til .env",
          "Installér afhængigheder og åbn udviklingsserveren"
        ]
      },
      "day2": {
        "title": "Brand",
        "subtitle": "Gør den til din: farver, logo og navigation.",
        "tasks": [
          "Justér OKLCH-paletten i globals.css",
          "Udskift standardlogoet",
          "Omdøb navigationspunkterne i dashboardet"
        ]
      },
      "day3": {
        "title": "Auth & data",
        "subtitle": "Sæt dine nøgler op, og form databasen.",
        "tasks": [
          "Sæt AUTH_SECRET i dit miljø",
          "Definér dit domæneskema med Drizzle",
          "Generér og kør migreringerne"
        ]
      },
      "day4": {
        "title": "Dit produkt",
        "subtitle": "Den sjove del: ruter, widgets og AI til dit eget domæne.",
        "tasks": [
          "Tilføj dine ruter i router-træet",
          "Byg dine første dashboard-widgets",
          "Peg AI-chatten mod din udbyder"
        ]
      },
      "day5": {
        "title": "Lancering",
        "subtitle": "Bevis at det virker, og sæt det foran rigtige brugere.",
        "tasks": [
          "Kør Playwright-E2E-suiten",
          "Byg produktions-buildet",
          "Start Docker Compose-stakken"
        ]
      }
    }
  },
  "manifesto": {
    "eyebrow": "Derfor holder det",
    "items": {
      "structure": {
        "title": "Struktur",
        "statement": "Hver funktion bor i sit eget modul bag én import.",
        "proof": "Tolv moduler følger med i dag. Sletter du ét, vælter de andre ikke."
      },
      "security": {
        "title": "Sikkerhed",
        "statement": "Auth, roller og konfiguration afgøres før din første funktion — ikke efter dit første uheld.",
        "proof": "Better Auth-sessioner, RBAC og typet adgang til miljøvariabler er koblet til fra start."
      },
      "longevity": {
        "title": "Holdbarhed",
        "statement": "Udskift brandet, modulerne og teksterne. Arkitekturen er bygget til at overleve dem.",
        "proof": "Selv denne landingsside er et modul, du kunne udskifte i eftermiddag."
      }
    }
  },
  "contact": {
    "title": "Spørgsmål, før du kloner?",
    "description": "Skriv til os om skabelonen — et opsætningsproblem, en funktion du savner, eller tvivl om arkitekturen. Din besked lander i det samme contact-messages-modul, som følger med starteren.",
    "responseNote": "Vi svarer som regel inden for et par dage.",
    "form": {
      "email": { "label": "E-mail", "placeholder": "dig@firma.dk" },
      "projectType": {
        "label": "Emne",
        "placeholder": "Vælg et emne",
        "options": {
          "saas": "SaaS-produkt",
          "landing": "Marketingside",
          "webapp": "Internt værktøj"
        }
      },
      "message": {
        "label": "Din besked",
        "placeholder": "Hvad bygger du, og hvor kan vi hjælpe?"
      },
      "submit": "Send besked",
      "messages": {
        "successTitle": "Besked sendt",
        "successDescription": "Tak for din besked. Den ligger i vores indbakke — og i demo-dashboardet.",
        "errorTitle": "Kunne ikke sendes",
        "errorDescription": "Prøv igen om et øjeblik."
      }
    },
    "aside": {
      "github": {
        "title": "Åbent repositorium",
        "description": "Fejl og ønsker håndteres som GitHub-issues. Roadmappet er offentligt.",
        "cta": "Åbn GitHub"
      },
      "async": {
        "title": "Asynkront som udgangspunkt",
        "description": "Ingen opkald, ingen møder. Skriv når det passer dig — vi svarer på samme måde."
      },
      "updates": {
        "title": "Opdateringer uden støj",
        "description": "Release notes lander i din indbakke højst én gang om måneden."
      }
    }
  },
  "footer": {
    "brand": "edd Starter",
    "since": "Fundamentet for det næste",
    "copyright": "© {{year}} edd. Alle rettigheder forbeholdes.",
    "description": "Ét fundament for hvert edd-produkt: samme kvalitet, samme konventioner, hurtigere levering.",
    "backToTop": "Til toppen",
    "subscribe": {
      "title": "Nyt om starteren",
      "placeholder": "dig@firma.dk",
      "button": "Tilmeld",
      "note": "Release notes og lanceringstips. Højst én mail om måneden."
    },
    "links": {
      "essence": {
        "title": "Starter",
        "items": ["Arkitektur", "Moduloversigt", "Designtokens", "Konventioner"]
      },
      "company": {
        "title": "Produkt",
        "items": ["Roadmap", "Changelog", "Integrationer", "Release notes"]
      },
      "community": {
        "title": "Support",
        "items": ["Dokumentation", "Guides", "Eksempler", "FAQ"]
      },
      "legal": {
        "title": "Jura",
        "items": ["Privatliv", "Vilkår", "Cookies", "Licenser"]
      }
    }
  }
}
```

- [ ] **Step 2: Apply, run the smoke test** — `pnpm vitest run src/modules/landing/__tests__/home-i18n.test.ts` — all green. Note: the legacy-key assertions will pass only after old keys are removed by the Python snippet (it replaces the whole `home` object, so `home.hero` etc. disappear automatically).
- [ ] **Step 3: Run `pnpm i18n:check`** — Expected: PASS (all three locales in sync).
- [ ] **Step 4: Commit** — `git add src/shared/lib/i18n src/modules/landing/__tests__ docs/superpowers/plans/copy && git commit -m "feat(landing): rebuild home i18n namespace with native EN/ES/DK copy"`

> Note: scene components don't exist yet, but they reference the new keys with fallbacks; the app still renders the old components against deleted keys' fallbacks until Task 12 swaps HomePage. To keep main usable between commits, Tasks 2–12 may be done on a branch (`feat/cinematic-landing`) and merged at the end. **Create the branch before Task 1.**

---

### Task 5: Scene primitives

**Files:**

- Create: `src/modules/landing/components/scenes/SceneHeader.tsx`
- Create: `src/modules/landing/components/scenes/index.ts` (grows with each task)

- [ ] **Step 1: Write `SceneHeader.tsx`**

```tsx
'use client'

import { m } from 'framer-motion'

interface SceneHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'center' | 'left'
}

export function SceneHeader({ eyebrow, title, description, align = 'center' }: SceneHeaderProps) {
  const alignment =
    align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left'

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`flex max-w-3xl flex-col gap-4 ${alignment}`}
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </m.div>
  )
}
```

- [ ] **Step 2: Create `scenes/index.ts`** with `export { SceneHeader } from './SceneHeader'` (append further exports per task).
- [ ] **Step 3: `pnpm type-check`** → PASS. Commit: `feat(landing): add scene header primitive`.

---

### Task 6: OpeningScene

**Files:**

- Create: `src/modules/landing/components/scenes/OpeningScene.tsx`

Behavior contract (full code written at execution; everything below is binding):

- `<section id="home" aria-label={t('home.opening.ariaLabel')}>`, `min-h-screen`, keeps `useWaveAnimation({ canvasRef, prefersReducedMotion })` with `useReducedMotion()` from framer-motion; canvas `opacity-60`, `aria-hidden`.
- Badge pill: `home.opening.badge` with `Sparkles` icon.
- Headline: `h1` two lines — `home.opening.title` then `home.opening.titleHighlight` in `text-primary`; lines revealed with stagger: parent variants `{ visible: { transition: { staggerChildren: 0.18 } } }`, each line `initial {opacity:0, y:'0.6em'}` inside an `overflow-hidden` span (mask reveal). Sizes `text-5xl sm:text-6xl lg:text-8xl`, `tracking-tight`.
- Description paragraph (`home.opening.description`), max-w-2xl.
- Command console: same copy-to-clipboard block as the old hero (verbatim command `npx @edd_remonts/create-edd-app my-product`, `Check`/`Copy` icons, `copied` state 2 s), plus secondary button `home.opening.ctaSecondary` that smooth-scrolls to `#services`.
- Arc strip: `<nav aria-label={t('home.opening.arc.ariaLabel')}>` with three buttons (`60 s → #first-minute`, `1 h → #services`, `5 d → #timeline`); each shows `value` in `text-3xl md:text-4xl font-bold` (value uses `tabular-nums`) and `label` in `text-xs text-muted-foreground`; separated by vertical hairlines; smooth-scroll on click; staggered entrance after headline.
- Scroll cue at bottom center: `home.opening.scrollCue` + animated chevron (`animate-bounce`, `motion-reduce:animate-none`).
- No tabbed mockup here (moved to scenes 3–4).

- [ ] **Step 1: Write the component per contract** (use the old `GlowyWavesHero.tsx` lines 23–137 as the base; strip the tab block; add arc strip + scroll cue + reduced-motion wiring).
- [ ] **Step 2: Export from `scenes/index.ts`. `pnpm type-check` → PASS. Commit.**

---

### Task 7: FrictionScene

**Files:**

- Create: `src/modules/landing/components/scenes/FrictionScene.tsx`

Contract:

- `<section id="friction">`, `bg-muted/20 dark:bg-muted/5`, `py-24 md:py-32`.
- Desktop ≥ lg: `grid lg:grid-cols-[2fr_3fr] gap-12`; left column wraps `SceneHeader` (align="left", eyebrow `home.friction.eyebrow`, title, description) in `lg:sticky lg:top-28 self-start`.
- Right column: five row-cards built from `ROW_IDS = ['auth','architecture','tests','ai','docker']`, keys `home.friction.rows.<id>.{name,starter,scratch}`. Each card: name as `h3`; two stacked panels — "withStarter" (green `Check` icon, `border-primary/15 bg-primary/5`) and "fromScratch" (`X` icon, muted) — with the `home.friction.withStarter` / `home.friction.fromScratch` labels as tiny uppercase captions.
- Each card: `m.div initial={{opacity:0, y:32}} whileInView={{opacity:1, y:0}} viewport={{once:true, margin:'-60px'}} transition={{duration:0.55, delay: index*0.04}}`.
- Mobile: same markup, naturally stacks (no sticky below lg).

- [ ] **Step 1: Write component.** Step 2: export, `pnpm type-check`, commit.

---

### Task 8: FirstMinuteScene

**Files:**

- Create: `src/modules/landing/components/scenes/FirstMinuteScene.tsx`

Contract:

- `<section id="first-minute">`, `py-24 md:py-32`.
- `SceneHeader` (eyebrow/title/description from `home.firstMinute.*`).
- Terminal panel (max-w-2xl, rounded-xl, `bg-foreground/[0.03] dark:bg-background/60`, traffic-light dots, `role="img" aria-label={t('home.firstMinute.terminalAria')}`). Lines (literal, untranslated — they are tool output):

```
$ npx @edd_remonts/create-edd-app my-product
✔ Scaffolding my-product
  ├─ src/modules        12 modules
  ├─ drizzle/           migrations ready
  ├─ e2e/               playwright configured
  └─ .env.example       34 variables documented
✔ Done in 58s — pnpm dev to start
```

Reveal: parent `m.div` with `staggerChildren: 0.35` on `whileInView` (once); each line `initial={{opacity:0}}`; blinking caret on the last line via `animate-pulse motion-reduce:animate-none`. With `useReducedMotion()` render all lines statically.

- Below: the three architecture boxes (App Shell / Domain Modules / Integrations & QA) — port the markup from old `GlowyWavesHero.tsx` lines 180–279, replacing every hardcoded string with `home.firstMinute.boxes.<box>.{title,tag,description}` and keeping the tech chips (`tanstack router`, `tailwind v4`, `drizzle`, `playwright E2E` — proper nouns, untranslated). Chevron connectors hidden below md.

- [ ] **Step 1: Write component.** Step 2: export, `pnpm type-check`, commit.

---

### Task 9: FirstHourScene

**Files:**

- Create: `src/modules/landing/components/scenes/FirstHourScene.tsx`

Contract:

- `<section id="services">`, `py-24 md:py-32`, ambient `bg-primary/5 blur-[100px]` glow div like old `OurServicesSection`.
- `SceneHeader` from `home.firstHour.*`.
- Tab switcher (two buttons: `home.firstHour.tabs.auth` / `home.firstHour.tabs.dashboard`) + `AnimatePresence mode="wait"` content — port the auth-card and dashboard mockups from old `GlowyWavesHero.tsx` lines 282–457, replacing **every** visible string with `home.firstHour.mock.*` keys (workspaceTitle, workspaceSubtitle, emailLabel, emailPlaceholder, passwordLabel, signIn, orAccessVia, socialLogin, clerkSSO, navDashboard, navUsers, navTransactions, navBudgets, volume, projects, projectsValue, apiLatency, inProduction, operational, recentActivity, autoSync, acme, globalDelivery, today, yesterday, approved, pending). Numeric values (`$12,450.00`, `48 ms`, `$1,200.00`, `$450.00`) stay literal.
- Stack grid: heading row (`home.firstHour.stack.title` + `description`), then 6 cards from `ITEMS = [{id:'landing', icon: Layout}, {id:'shell', icon: PanelsTopLeft}, {id:'auth', icon: Lock}, {id:'data', icon: Database}, {id:'ai', icon: Bot}, {id:'quality', icon: ShieldCheck}]` (lucide icons), keys `home.firstHour.stack.items.<id>.{title,description}`. Stagger container variants as in old `OurServicesSection` (staggerChildren 0.1). No numbers in titles, no CTA buttons.

- [ ] **Step 1: Write component.** Step 2: export, `pnpm type-check`, commit.

---

### Task 10: FiveDaysScene (signature scene)

**Files:**

- Create: `src/modules/landing/components/scenes/FiveDaysScene.tsx`

Contract:

- `<section id="timeline">`, `py-24 md:py-32`, top border like old block.
- `SceneHeader` from `home.fiveDays.*`.
- Sticky progress header card (`home.fiveDays.progress.title` + `stats` interpolation + `<Progress>`), `lg:sticky lg:top-20 z-10 backdrop-blur`.
- Scroll spine: wrapper `ref={spineRef}` around the 5 day-cards; vertical hairline on the left (`absolute left-[19px] top-0 bottom-0 w-px bg-border`) plus a fill line `m.div` with `scaleY: useTransform(scrollYProgress, [0,1],[0,1])`, `origin-top`, `bg-primary`, where `const { scrollYProgress } = useScroll({ target: spineRef, offset: ['start 0.7', 'end 0.5'] })`. With `useReducedMotion()`, render the fill at full height statically.
- Day data: ids `day1..day5`, hard data colocated:

```ts
const DAYS = [
  { id: 'day1', command: 'pnpm install && pnpm dev', file: '.env.example' },
  { id: 'day2', command: undefined, file: 'src/shared/styles/globals.css' },
  { id: 'day3', command: 'pnpm db:generate && pnpm db:migrate', file: 'drizzle.config.ts' },
  { id: 'day4', command: 'pnpm routes:inventory', file: 'src/routes/' },
  { id: 'day5', command: 'pnpm test:e2e && pnpm build', file: 'docker-compose.yml' },
] as const
```

- Each day card (all visible, no tabs): left gutter shows a numbered node on the spine (filled `bg-primary text-primary-foreground` when every task of that day is checked, otherwise outlined); card shows `home.fiveDays.dayLabel` ({{num}}), `days.<id>.title`, `days.<id>.subtitle`, then the interactive checklist — tasks come from `t('home.fiveDays.days.<id>.tasks', { returnObjects: true }) as string[]`; checked state in `useState<Record<string, boolean>>` keyed `<id>-<index>` (no default-checked items); `CheckCircle2`/`Circle` icons, line-through when checked; then command/file chips with `commandLabel`/`fileLabel` captions (render only when present).
- Global progress derives from checked count over `DAYS.length * 3`.
- Entrance: each card `whileInView` fade/slide once.

- [ ] **Step 1: Write component.** Step 2: export, `pnpm type-check`, run `pnpm vitest run src/modules/landing/__tests__/home-i18n.test.ts` (still green), commit.

---

### Task 11: ManifestoScene + ClosingScene

**Files:**

- Create: `src/modules/landing/components/scenes/ManifestoScene.tsx`
- Create: `src/modules/landing/components/scenes/ClosingScene.tsx`

ManifestoScene contract:

- `<section>` `py-28 md:py-40`, max-w-5xl. Eyebrow `home.manifesto.eyebrow` centered.
- Three items (`structure`, `security`, `longevity`), each a full-width row: small numbered caption + `title` (uppercase, `text-xs tracking-[0.25em] text-primary`), `statement` as the hero text (`text-3xl md:text-5xl font-bold tracking-tight text-balance`), `proof` as `text-sm text-muted-foreground` beneath. Rows separated by hairlines, generous spacing (`py-12`), each `m.div` whileInView reveal with `y: 40`, duration 0.7.

ClosingScene contract:

- `<section id="contact">` with the old `ContactBlock` grid-paper background div.
- `SceneHeader` (title `home.contact.title`, description `home.contact.description`); `home.contact.responseNote` as the small trailing line.
- Two-column grid: left `<Card>` wrapping the untouched `<ContactForm />` (same gradient overlay as before); right column three aside cards:
  - github: `Github` icon (lucide), `home.contact.aside.github.{title,description}` + an `<a href="https://github.com/eddremonts86/edd-app-template" target="_blank" rel="noreferrer">` link labeled `home.contact.aside.github.cta` with `ArrowUpRight` icon.
  - async: `Clock3` icon, `home.contact.aside.async.{title,description}`.
  - updates: `Mail` icon, `home.contact.aside.updates.{title,description}`.
  - No "Included" badge, no SLA language.

- [ ] **Step 1: Write both components.** Step 2: export both, `pnpm type-check`, commit.

---

### Task 12: Recompose HomePage, prune old blocks, footer fixes

**Files:**

- Modify: `src/modules/landing/components/HomePage.tsx`
- Modify: `src/modules/landing/components/index.ts`
- Modify: `src/modules/landing/components/FooterBlock.tsx`
- Delete: old block components

- [ ] **Step 1: Rewrite `HomePage.tsx`:**

```tsx
import {
  OpeningScene,
  FrictionScene,
  FirstMinuteScene,
  FirstHourScene,
  FiveDaysScene,
  ManifestoScene,
  ClosingScene,
} from './scenes'

export function HomePage() {
  return (
    <div>
      <OpeningScene />
      <FrictionScene />
      <FirstMinuteScene />
      <FirstHourScene />
      <FiveDaysScene />
      <ManifestoScene />
      <ClosingScene />
    </div>
  )
}
```

(`id="home"` lives on OpeningScene's section; `services/timeline/contact` ids live on their scenes.)

- [ ] **Step 2: Update `components/index.ts`** — remove exports of deleted blocks; keep `HomePage`, `FooterBlock`, `ContactForm`; re-export scenes if needed by tests.
- [ ] **Step 3: FooterBlock copy fixes** — replace hardcoded `Back to Top` with `{t('home.footer.backToTop', 'Back to top')}`.
- [ ] **Step 4: Check leftover consumers before deleting:**

Run: `grep -rn "GlowyWavesHero\|ComparisonBlock\|FeatureCardsBlock\|OurServicesSection\|FiveDayPlanBlock\|ContactBlock\|FeatureCard\|ServiceCard" src e2e --include='*.ts*' | grep -v components/scenes`
Expected: only the files being deleted and their barrel entries. If e2e specs reference them, update selectors there too.

- [ ] **Step 5: Delete** the eight old component files. Also delete `ContactInfoCard.tsx` / `WorkingHoursCard.tsx` **only if** the grep shows no consumers.
- [ ] **Step 6: `pnpm type-check && pnpm lint`** → PASS. Commit: `feat(landing): compose cinematic scenes, remove legacy blocks`.

---

### Task 13: Full verification

- [ ] **Step 1:** `pnpm validate` → all gates green (type-check, lint, prettier, i18n parity, unit tests).
- [ ] **Step 2:** `pnpm dev:fast` (or `pnpm dev` if DB down) → manual pass: EN/ES/DK switcher × light/dark × ~390 px and desktop widths. Verify: arc strip anchors scroll correctly, terminal reveal plays once, spine fills with scroll, checklists toggle, contact form submits (DB up), reduced-motion (DevTools emulation) shows static fallbacks.
- [ ] **Step 3:** `pnpm test:e2e` — update any landing specs that referenced removed markup.
- [ ] **Step 4:** Final commit + update `docs/superpowers/plans/2026-06-10-cinematic-landing.md` checkboxes.

---

## Self-review notes

- Spec coverage: scenes 1–7 → Tasks 6–11; copy/i18n → Tasks 1–4; anchors → Tasks 6/9/10/11/12; a11y/reduced-motion → contracts in 6, 8, 10; verification → Task 13. Footer phantom routes stay out of scope per spec.
- `home.contact` kept (not `home.closing`) so `ContactForm.tsx` needs zero changes — deviation documented in File map.
- Type consistency: scene names and i18n key paths in Task 1's test match the JSON in Tasks 2–4 and the contracts in Tasks 6–11.
