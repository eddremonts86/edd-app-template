# Product Context — edd-app-template

## Register

**brand** — This is the application template itself (the product shipped to developers). When working on the landing page, marketing copy, README, or the create-edd-app CLI flow, use the brand register: confident, technical, opinionated.

**product** — When working on authenticated dashboard UI (settings, users, AI config, widgets, modules), use the product register: utility-first, dense-but-readable, professional. Developers are the end users configuring their app; treat them as capable adults.

---

## Who Uses This

**Primary persona — the founding developer:**
A solo dev or small team bootstrapping a new SaaS. They are TypeScript-first, know React well, and want a working foundation — not another toy CRUD demo. They will spend most of their time inside the dashboard (settings, user management, AI config) before adding their own domain modules.

**Secondary persona — the open-source contributor:**
Experienced developers who extend or fork the template. They read code more than prose; clarity and consistency in component APIs matter more than visual polish at this layer.

---

## Product Purpose

A production-ready, opinionated SaaS monolith starter. Ships with every cross-cutting concern already wired: auth, database, AI (multi-provider), i18n, error tracking, E2E testing, and a modular architecture that scales without refactoring.

The core promise: **zero to working SaaS in under 30 minutes**, with no compromises on production quality.

---

## Brand Personality

- **Confident, not arrogant.** Makes strong technical choices and defends them, but doesn't belittle alternatives.
- **Dense, not cluttered.** Dashboard UI should communicate maximum information with minimum noise.
- **Warm, not corporate.** Primary color is a coppery orange — approachable and energetic, not cold blue enterprise.
- **Precise, not verbose.** Every label, toast, and empty state should say exactly what it needs to and stop.

---

## Tone of Voice

- Direct. "Save Changes" not "Click here to save your changes".
- Active. "Creating…" not "Your request is being processed".
- Honest. Error messages name what failed and suggest what to try.
- No filler. No "Amazing!", no "We're so excited to…", no padding words.

---

## Anti-References (What This Is NOT)

- **Not a Vercel demo** — No pure-aesthetic showcases with no real functionality behind them.
- **Not a shadcn starter kit** — Shadcn is used but this is a full-stack app, not a component catalog.
- **Not a corporate enterprise tool** — No cold blues, no 8px border-radius everything, no helvetica tables.
- **Not an "AI-built" template** — No purple gradients, no glowing accents on dark, no neon cards, no Inter everywhere.
- **Not a landing page generator** — The main surface is the authenticated dashboard, not the marketing page.

---

## Strategic Design Principles

1. **Information density over decoration.** Dashboard users are power users. Surface data clearly; add decoration only when it aids comprehension.
2. **Consistency over creativity.** All modules share the same layout conventions (list → sheet, empty state, loading state). New modules must follow existing patterns.
3. **Warm neutrals, not cold greys.** All neutral tones are tinted toward the primary orange hue (hue ~30–35 in OKLCH) to maintain cohesion.
4. **Readable at a glance.** Every table row, widget, and card must be scannable without hovering. Never gate critical information behind tooltips.
5. **Accessible by default.** Every interactive element must be keyboard-reachable and have a visible focus ring using the primary color ring token.
6. **Dark mode is a peer, not an afterthought.** The dark palette uses a warm near-black (oklch 0.12, hue 30) — not a desaturated gray. Both modes must look intentional.
