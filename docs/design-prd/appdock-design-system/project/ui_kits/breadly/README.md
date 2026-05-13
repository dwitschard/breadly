# Breadly — UI kit

The first sub-brand. Lives inside the AppDock shell. Smells like sourdough.

## Surfaces in this kit
- **Recipe list** — amber-tinted recipe cards with the flat amber edge stripe. Pills for hydration / loaves / scheduled.
- **Scheduler** *(centerpiece)* — phase bars colored by phase type, live countdown ticking every second with `scale(1.02)` pulse, ready ripple, bottom drawer with step-by-step instructions.
- **Add recipe** — multi-step form, fade-in transitions per step, embedded hydration calculator that recomputes live.
- **Empty state** — Breadly loaf glyph in amber-200, calm copy, single amber CTA.

## Files
- `index.html` — runnable click-thru: list → scheduler, list → add → list, header buttons jump to empty / reset.
- `RecipeList.jsx` — `RecipeList`, `RecipeCard`, `EmptyState`.
- `Scheduler.jsx` — `Scheduler`, `PhaseBar`, `PhaseDrawer`, `PHASES`, `fmt`, `fmtSec`.
- `AddRecipe.jsx` — `AddRecipe`, `HydrationCalculator`.
- Shared primitives in `../_shared/components.jsx`.

## Interaction details worth knowing
- The countdown number runs an 80 ms `scale(1.02)` pulse every second while a phase is running. Wrapped in `prefers-reduced-motion: no-preference`.
- `ReadyRipple` keyframes scale + opacity from a single span at the bar's right end — single-color, never a hue shift.
- `PhaseDrawer` slides up 220 ms with `cubic-bezier(0.22, 1, 0.36, 1)`. Scrim fades in parallel.
- The hydration readout is a flat amber chip, not a gauge — flat fills only, per the system.
