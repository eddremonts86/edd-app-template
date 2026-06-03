# Critique: src — 2026-06-03

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Typing indicator, agent online/offline ping, toast feedback all solid |
| 2 | Match System / Real World | 3 | Chat UI metaphors correct; some i18n strings mix Spanish/English |
| 3 | User Control and Freedom | 3 | Can delete conversations; no undo on clear-all |
| 4 | Consistency and Standards | 3 | Sidebar + settings follow same card pattern; chat had mismatched indigo palette (fixed) |
| 5 | Error Prevention | 3 | Disabled send when empty; no confirm on delete-all |
| 6 | Recognition Rather Than Recall | 3 | Nav labels visible; sidebar search quick-access is good |
| 7 | Flexibility and Efficiency | 3 | Keyboard submit on chat; no command palette shortcuts visible |
| 8 | Aesthetic and Minimalist Design | 3 | Before: indigo/purple gradients clashed with brand. After: on-brand primary throughout |
| 9 | Error Recovery | 2 | Error messages in terminal/console only; no user-facing recovery flow for failed AI calls |
| 10 | Help and Documentation | 3 | /dashboard/help exists; empty states with suggestions |
| **Total** | | **30/40** | **Good — above average product UI** |

## Anti-Patterns Fixed (this session)

| Pattern | File | Status |
|---|---|---|
| `ai-color-palette` — indigo/purple gradients | HelpChatPage.tsx ×7 | ✅ Fixed → `bg-primary` |
| `bounce-easing` — animate-bounce | HelpChatPage.tsx ×6 | ✅ Fixed → `.typing-dot` wave animation |
| `gradient-text` — bg-clip-text | GlowyWavesHero.tsx | ✅ Fixed → `text-primary` solid |
| `side-tab` border-l-4 | AppSidebar.tsx (blockquote) | ✅ Reduced to border-l-2 |
| `side-tab` border-l-4 (blockquote) | HelpChatPage.tsx | ✅ Reduced to border-l-2 |

## False Positives (ignore)

| Pattern | File | Reason |
|---|---|---|
| side-tab border-l-2 | HelpChatPage.tsx:348 | Markdown blockquote renderer — semantic, not decorative |
| side-tab border-l-2 | _docs.tsx:146 | Active nav item indicator — recognized navigation affordance |

## Priority Issues Remaining

**[P1] Typing animation**: Custom `typing-dot` keyframe added but relies on CSS class injection — verify it renders in production build.

**[P2] Chat color system**: All indigo/purple references replaced with `bg-primary`. Verify brand consistency at runtime — especially dark mode where `--primary` shifts to `oklch(0.68 0.22 35)`.

**[P3] Landing hero gradient text**: Replaced with solid `text-primary`. Trade-off: less visual drama but avoids the AI gradient-text tell. Consider a subtle `text-shadow` or weight increase if more prominence is needed.

## Score Delta

Before: ~22/40 (indigo palette mismatch, bounce, gradient text)  
After: ~30/40 (on-brand, clean animations, no detected slop)
