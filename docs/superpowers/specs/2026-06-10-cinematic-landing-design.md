# Cinematic Landing Rebuild — Design Spec

**Date:** 2026-06-10
**Status:** Approved by owner (scope: full scene rebuild; narrative: 60s → 1h → 5 days; ES register: usted; contact: product channel)

---

## 1. Goal

Rebuild the landing page (`src/modules/landing`) as a scene-based, scroll-choreographed narrative. Replace the current "stack of blocks" layout with a story in three acts. All copy is rewritten natively in EN, ES, and DK — no machine-translation artifacts, no hardcoded strings, no AI-sounding filler.

Constraints from `PRODUCT.md` apply in full: no purple gradients, no neon, no glow-on-dark "AI-built" aesthetic. Cinematic = typographic scale + scroll choreography + subtle parallax + copper used as light. Constraints from `CLAUDE.md` apply: all strings via `t()`, no business logic in routes, module barrel imports only.

## 2. Narrative arc

One unified promise replaces today's three conflicting time claims (1 hour / 30 minutes / 5 days):

| Beat | Claim | Backed by |
| ---- | ----- | --------- |
| **60 seconds** | A running scaffold | `npx @edd_remonts/create-edd-app my-product` |
| **1 hour** | A working app: auth, dashboard, AI chat, i18n | What ships pre-wired in the template |
| **5 days** | Production: branded, tested, deployed | The 5-day rollout checklist |

The arc appears in the hero as a stat strip and structures the page order. Section anchors `#services`, `#timeline`, `#contact` are preserved (used by `HomePage` wrappers today; topbar nav keys exist in locales).

## 3. Scene structure

`HomePage.tsx` composes seven scenes from `src/modules/landing/components/scenes/`:

### Scene 1 — `OpeningScene` (replaces `GlowyWavesHero`)
- Full viewport. Keeps `useWaveAnimation` canvas (slightly higher presence) + ambient blobs.
- Staggered headline reveal (per-line mask/translate, framer-motion variants).
- The `npx` command block is the hero object (copy-to-clipboard preserved).
- Arc strip: **60 s · 1 h · 5 días** — three items that anchor-scroll to scenes 3, 4, 5.
- Scroll cue at the bottom. The tabbed mockup moves OUT of the hero (to scenes 3–4).

### Scene 2 — `FrictionScene` (replaces `ComparisonBlock`)
- Desktop: sticky left column (headline + framing copy) while the five comparison pairs (from scratch vs. with the starter) reveal sequentially on scroll in the right column.
- Mobile / reduced-motion: simple stacked cards, no pinning.
- Content: the five existing rows (auth, architecture, tests, AI streaming, Docker), copy rewritten.

### Scene 3 — `FirstMinuteScene` (new; absorbs the hero "Architecture Map" tab)
- Animated terminal: types the npx command, prints a short scaffold tree (driven by scroll progress or in-view sequence; respects reduced motion → static final state).
- Resolves into the three-box architecture map (App Shell → Domain Modules → Integrations & QA) with choreographed entrance.

### Scene 4 — `FirstHourScene` (id `services`; absorbs hero auth/dashboard tabs + `OurServicesSection`)
- "After one hour you have this": interactive tabbed product mockup (auth card, dashboard preview) — the existing mockups relocated and re-skinned.
- Below: the six "what's inside" stack cards (landing, app shell, auth, data layer, config tokens, CI) with stagger. Numbered titles dropped; semantic keys.

### Scene 5 — `FiveDaysScene` (id `timeline`; replaces `FiveDayPlanBlock`)
- Signature scene. Scroll-linked vertical timeline: a progress spine fills as the user scrolls through day 1 → 5; each day card activates in turn.
- The interactive checklist (toggle tasks, global progress) is preserved as the engagement layer.
- Mobile / reduced-motion: plain vertical timeline, all days visible.

### Scene 6 — `ManifestoScene` (replaces `FeatureCardsBlock`)
- Three pillars (Structure / Security / Extensibility) as large typographic statements (one short sentence each + one-line proof), revealed line by line. No cards.

### Scene 7 — `ClosingScene` (id `contact`; rewrites `ContactBlock` copy) + `FooterBlock`
- Contact reframed as **product channel**: feedback, questions, support about the starter. Agency language ("send brief", SLA cards, "project onboarding") removed; replaced by honest support facts (GitHub issues, async answers, updates list).
- `ContactForm` component and its `contact-messages` submission logic reused as-is (labels re-copied).
- Footer kept structurally; copy polished; hardcoded "Back to Top" extracted.

## 4. Component plan

```
src/modules/landing/components/
  scenes/
    OpeningScene.tsx
    FrictionScene.tsx
    FirstMinuteScene.tsx
    FirstHourScene.tsx
    FiveDaysScene.tsx
    ManifestoScene.tsx
    ClosingScene.tsx
    index.ts
  HomePage.tsx          (recomposed)
  ContactForm.tsx       (kept)
  FooterBlock.tsx       (kept, copy fixes)
  FooterColumn.tsx, SocialLinks.tsx, ContactInfoCard.tsx, WorkingHoursCard.tsx (kept/pruned if unused)
  — deleted: GlowyWavesHero, ComparisonBlock, FeatureCardsBlock, OurServicesSection,
    FiveDayPlanBlock, ContactBlock, FeatureCard, ServiceCard (if unused elsewhere)
```

Barrel (`components/index.ts`, module `index.ts`) updated; no deep imports introduced. `useWaveAnimation` hook retained. Motion uses the already-present `m`/`AnimatePresence` (LazyMotion setup unchanged) plus `useScroll`/`useTransform`/`useReducedMotion`.

## 5. Copy & i18n

### Structure
- `home.*` namespace rebuilt with semantic keys per scene: `home.opening`, `home.friction`, `home.firstMinute`, `home.firstHour`, `home.fiveDays`, `home.manifesto`, `home.closing`, `home.footer`.
- Misleading legacy keys (`efficiency/ethics/closeness`, `software/design/mobility/...`) retired.
- Every visible string in scene components goes through `t()` — including the previously hardcoded mockup descriptions, table headers, "Verification Tasks", "Run Command", "Target File", "Included", "Back to Top".
- `landing.*` mockup keys consolidated where reused.
- All three locales updated in the same commit; `pnpm i18n:check` must pass.

### Voice per language (written natively, not translated)
| | Register | Notes |
|--|----------|-------|
| **EN** | Professional, direct, PRODUCT.md tone ("Save Changes", no filler) | Fix broken phrases; no Spanish leakage |
| **ES** | **Usted**, cálido y directo — formal sin burocracia | Tecnicismos dev en inglés (stack, deploy, boilerplate); fuera el Spanglish gratuito; tildes y mayúsculas correctas (no Title Case inglés) |
| **DK** | **Du** (formal *De* is archaic in Danish software) | "AI" not "IA"; "af" not "av"; correct compounds (produktionsbuild); idioms with correct article ("den dybe tallerken") |

### Anti-AI checklist for all copy
No "Amazing!/We're excited", no empty superlatives, no symmetrical triads for their own sake, concrete nouns over abstractions, every claim verifiable against the repo (commands, file paths, package names must be real).

## 6. Accessibility & performance
- `useReducedMotion` → every scroll-linked effect has a static fallback; Tailwind `motion-reduce:` for CSS animations.
- Sticky/pinned scenes are desktop-only (`lg:`); mobile gets linear flow.
- No scroll-jacking; native scroll always wins.
- Headings hierarchy: one `h1` (opening), `h2` per scene.
- Canvas/terminal animations pause when offscreen (existing wave hook already RAF-based; keep IntersectionObserver guard if cheap).
- Focus rings and keyboard reachability per DESIGN.md.

## 7. Out of scope
- Topbar redesign, auth pages, dashboard.
- Footer phantom routes (`/starter/architecture` …) — links kept as-is.
- New dependencies (no GSAP/Lenis; framer-motion only).
- DB schema, module manifest type, auth providers.

## 8. Verification
1. `pnpm validate` (type-check, lint, prettier, i18n parity, unit tests).
2. Dev server visual pass: three languages × light/dark × mobile/desktop.
3. Playwright smoke: landing renders, anchors `#services/#timeline/#contact` resolve, contact form submits.
4. Reduced-motion spot check (emulate `prefers-reduced-motion`).
