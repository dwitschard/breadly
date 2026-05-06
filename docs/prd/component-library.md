# PRD: Breadly Component Library

## Problem Statement

Breadly's frontend has no shared UI component library. Developers building new features copy-paste Tailwind utility classes across feature files to produce buttons, form controls, dialogs, and tags. This produces:

- **Visual inconsistency** — the same button appears with slightly different sizing, spacing, or colour depending on who wrote it and when.
- **Duplicated interaction logic** — toggle behaviour, loading states, focus management, and validation error display are re-implemented per feature.
- **No single source of truth** — when the design changes a token (e.g. the primary amber shade), developers must hunt down every hard-coded occurrence.
- **Slow feature development** — developers spend time styling primitives instead of building product logic.

The AppDock design system already defines the visual language for Breadly — amber-600 primary, warm-gray neutrals, Geist typeface, Lucide icons at 1.5px stroke — but it exists only as an HTML/CSS prototype in the design handoff bundle. There is no Angular implementation.

---

## Solution

Implement all 17 components defined in the AppDock component-library design spec as standalone Angular dumb components in `shared/components/`. Each component encapsulates its own visual states (hover, focus, disabled, error, loading), emits strongly-typed outputs, and accepts all variable content through Angular `input()` signals and `ng-content` slots. No component injects a service or manages application state.

Alongside the components, deliver:

- **Tailwind v4 theme extension** — add the AppDock warm-neutral color ramp as custom tokens so components use named Tailwind classes, not arbitrary values.
- **Dark mode via Tailwind `dark:` prefix** — configure Tailwind's class-based dark strategy; a `ThemeService` toggles the `dark` class on `<html>` and persists the preference.
- **Storybook** — install `@storybook/angular` with one story file per component, covering every design-spec variant and state. The `@storybook/addon-themes` addon provides the light/dark toggle.
- **Unit tests** — every component has a spec file using Angular Testing Library (`renderWithProviders`).

---

## User Stories

### Developer experience — consuming components

1. As a frontend developer, I want a `app-button` component with `primary`, `secondary`, `ghost`, and `danger` variants, so that I never have to write button Tailwind classes from scratch.
2. As a frontend developer, I want the button to accept an optional leading icon slot and a `loading` input, so that I can show a spinner in-place without changing the button's layout.
3. As a frontend developer, I want to bind `[disabled]="true"` on `app-button` and have it automatically become `opacity-50 cursor-not-allowed`, so that I don't need to repeat this pattern in every template.
4. As a frontend developer, I want an `app-tag` component with `success`, `danger`, `neutral`, `info`, and `disabled` colour variants, so that I can display recipe phase or step status consistently everywhere.
5. As a frontend developer, I want an `app-badge` component that wraps a Lucide icon and displays an optional numeric count indicator clipped to `99+`, so that I can show notification counts on nav icons.
6. As a frontend developer, I want an `app-spinner` with `sm`, `md`, and `lg` size variants, so that I can use the same loading indicator in buttons, inline contexts, and full-panel loading states.
7. As a frontend developer, I want an `app-checkbox` that manages its own `checked`, `indeterminate`, and `error` visual states, so that I only need to bind a value signal and listen to one `checkedChange` output.
8. As a frontend developer, I want an `app-radio` and `app-radio-group` component that accepts an `options` array and a `value` signal, so that I can build radio-based form fields without manually wiring individual inputs.
9. As a frontend developer, I want an `app-toggle` (switch) component with an optional label, so that I can build on/off preference controls with one line of template.
10. As a frontend developer, I want an `app-dropdown` (custom select) that accepts `options`, `value`, `placeholder`, `disabled`, and `error` inputs, so that I don't need to rebuild a styled select trigger and option list per feature.
11. As a frontend developer, I want an `app-slider` with `min`, `max`, `step`, `value`, and `disabled` inputs, so that I can expose numeric range controls (e.g. hydration percentage) without custom range-input CSS.
12. As a frontend developer, I want an `app-segmented` (segmented control) for mutually exclusive option selection, so that I can replace groups of filter buttons with a compact single component.
13. As a frontend developer, I want an `app-filter-tag` (pill toggle) for filter bars, so that recipe list filters like "Alle / Aktiv / Wartend" have a consistent active/inactive visual.
14. As a frontend developer, I want an `app-tab-group` that accepts a `tabs` array and an `activeTab` id, so that tab navigation is consistent across all feature pages.
15. As a frontend developer, I want an `app-dialog` that uses the native `<dialog>` element, accepts `title`, `open`, `loading`, and `destructive` inputs, and emits `confirm`, `cancel`, and `dismissed` outputs, so that all modal dialogs share structure and accessibility.
16. As a frontend developer, I want an `app-sidebar` (right-side drawer) with `open` and `title` inputs, a `dismissed` output, and `ng-content` slots for body and footer, so that slide-in panels are reusable across features.
17. As a frontend developer, I want an `app-headline` component with a `level` input (`display`, `h1`–`h4`, `body`, `muted`, `caption`), so that typography is consistently applied without memorising which Tailwind class combination maps to which heading level.
18. As a frontend developer, I want an `app-icon` component that accepts a Lucide icon component class and `size` / `strokeWidth` inputs, so that I can dynamically render icons with consistent attributes without importing `LucideAngularModule` in every feature.
19. As a frontend developer, I want every component to have `data-testid` attributes on its key interactive elements, so that E2E tests can target them with stable selectors.
20. As a frontend developer, I want all components to pass AXE accessibility checks out of the box, so that I don't need to add ARIA attributes individually when using them.

### Dark mode

21. As a frontend developer, I want a `ThemeService` with `setTheme('light' | 'dark')` and a `theme` readonly signal, so that I can wire a theme toggle to any UI element without accessing the DOM directly.
22. As a frontend developer, I want the theme preference persisted to `localStorage`, so that the user's choice survives page reloads.
23. As a user, I want the app to respect my previous theme preference on load, so that I don't have to reset it every visit.
24. As a frontend developer, I want every component to expose correct `dark:` Tailwind variants, so that flipping the `dark` class on `<html>` automatically switches the entire UI without additional code.

### Storybook

25. As a frontend developer, I want a Storybook instance that documents all 17 components, so that I can browse every variant and state without running the full application.
26. As a frontend developer, I want each Storybook story to show every design-spec state (default, hover, focus, disabled, error, loading), so that I can visually validate the implementation against the design spec.
27. As a frontend developer, I want the Storybook `@storybook/addon-themes` dark/light toggle, so that I can verify dark mode on every component without editing code.
28. As a frontend developer, I want Storybook to run independently of the Angular dev server, so that designers and developers can review components at any time via a static build.

### Quality & maintainability

29. As a frontend developer, I want every component to have a unit test file using Angular Testing Library, so that regressions are caught before they reach the main branch.
30. As a frontend developer, I want the warm-neutral AppDock color ramp defined as Tailwind `@theme` tokens (`warm-25` through `warm-950`), so that all components use named Tailwind classes and static analysis tools (editor autocomplete, Tailwind IntelliSense) work correctly.
31. As a frontend developer, I want components to use `ChangeDetectionStrategy.OnPush`, so that they do not cause unnecessary change-detection cycles in the application.
32. As a frontend developer, I want all component inputs and outputs typed with TypeScript generics where appropriate, so that the compiler catches misuse at build time.
33. As a frontend developer, I want the AGENTS.md architecture document updated to describe the component library, dark mode pattern, and Storybook workflow, so that new contributors can follow the conventions without reverse-engineering the code.

---

## Implementation Decisions

### Tailwind v4 theme extension
The AppDock design system's `warm-*` neutral ramp (warm-25 through warm-950) and `slate-*` subset are not present in Tailwind's default palette. These tokens will be added to `src/styles.css` using Tailwind v4's `@theme` directive so they are available as standard Tailwind utility classes (`bg-warm-25`, `text-warm-900`, etc.). The full amber ramp already exists in Tailwind v4 and does not need to be redeclared.

### Dark mode strategy
Dark mode will use Tailwind's `class`-based dark strategy. The `dark` class is toggled on the `<html>` element. Components express dark variants using the `dark:` prefix (e.g. `dark:bg-warm-900`). This matches Tailwind's standard approach and makes dark mode composable at the Tailwind layer. The AppDock prototype's `[data-theme="dark"]` CSS selectors are translated to `dark:` prefixes during implementation.

### ThemeService
A new `ThemeService` (`providedIn: 'root'`) will be introduced in `shared/`:
- Public `readonly theme: Signal<'light' | 'dark'>` — derived from a private writable signal.
- `setTheme(theme: 'light' | 'dark'): void` — updates the signal, writes to `localStorage`, and adds/removes the `dark` class on `document.documentElement`.
- On construction, reads `localStorage` (key: `breadly-theme`) and applies the saved preference.

### Component architecture
All 17 components live in `shared/components/` as standalone Angular components. Every component:
- Uses `ChangeDetectionStrategy.OnPush`.
- Declares `input()` and `output()` (not `@Input()`/`@Output()` decorators).
- Injects no services (ThemeService is only used by containers/pages that need to render a toggle control).
- Uses `ng-content` slots for variable body content (dialog body, sidebar body, button label, filter tag label).
- Expresses all styling with Tailwind utility classes; no per-component `.css` files.
- Includes `data-testid` attributes on key interactive and structural elements.
- Uses native HTML semantics where possible (`<dialog>`, `<input type="range">`, `<input type="checkbox">`, `<input type="radio">`).

### Form control inputs (Checkbox, Radio, RadioGroup, Toggle, Slider, Dropdown)
These components maintain an internal `signal()` for current value. They accept a `value` (or `checked`/`on`) input to set the initial or externally controlled value, and emit a strongly-typed `valueChange` (or `checkedChange`/`toggle`) output on every interaction. They also accept `required`, `error`, and `helperText` inputs for validation display. Internal `_touched` signal tracks whether the user has interacted, enabling deferred error display. No `ControlValueAccessor` is implemented; parent containers manage form state via signals.

### Icon component
`app-icon` accepts a Lucide icon component class (`Type<unknown>`) as an `input()` and renders it using Angular's `NgComponentOutlet` with `ngComponentOutletInputs` (Angular 16+) to pass `size` and `strokeWidth`. This avoids importing all icons at once (tree-shaking preserved) while still being injectable by name.

### Dialog component
Uses the native `<dialog>` element. An Angular `effect()` calls `.showModal()` / `.close()` reactively based on the `open` input signal. Backdrop clicks are detected via the `click` event on the `<dialog>` element itself (checking `event.target === dialogRef`). The `destructive` input switches the confirm button to `danger` variant and shows a warning icon in the title.

### Sidebar component
Implemented as a fixed full-viewport overlay with a slide-in right-side panel. An `@if (open())` guard conditionally renders the overlay. Animation is achieved via Tailwind's `transition-transform` and `translate-x-full` / `translate-x-0` classes toggled by an `isVisible` signal that runs one tick behind `open()` (to allow the enter animation to play). The scrim captures backdrop clicks and emits `dismissed`.

### Storybook
Storybook 8 (`@storybook/angular`) will be installed in `breadly-frontend`. Configuration includes:
- `@storybook/addon-themes` for the light/dark toggle (applies/removes `dark` class on `<html>`).
- Stories written in CSF3 (Component Story Format) with `meta.component` pointing to the Angular component.
- One story file per component (`<name>.stories.ts`) covering every design-spec variant.
- Storybook runs on its own dev server (separate from `ng serve`).
- A `build-storybook` npm script produces a static output for review.

### Updated AGENTS.md sections
- Section 10 (Styling): add dark mode pattern — configure `darkMode: 'class'`, use `dark:` prefix, `ThemeService` toggles the class.
- New Section 24: Component Library — documents the 17 components, selector prefix `app-`, props/slots/outputs conventions.
- New Section 25: Storybook — documents how to run, add stories, and the CSF3 pattern.

---

## Testing Decisions

### What makes a good test
Tests assert observable user-facing behaviour, not implementation details. A good test queries the DOM using semantic roles (`getByRole`, `getByLabelText`) rather than CSS selectors or component instance properties. It simulates real user interactions via `userEvent`. It does not spy on signal internals or access `fixture.componentInstance`.

### Which modules will have unit tests
All 17 components will have spec files. Each spec covers:
- Default render (required inputs, slot content visible).
- Variant states (e.g. `primary` vs `secondary` for Button).
- Disabled state (element has `disabled` attribute or `aria-disabled="true"`).
- Interactive behaviour (click emits expected output; toggle flips state).
- Error/validation state (error border and helper text render when `error=true`).
- Accessibility attributes (`aria-label`, `role`, `aria-checked` etc. present as expected).

`ThemeService` will have a standalone Vitest unit test (plain `TestBed`, no ATL) covering:
- Default theme read from `localStorage`.
- `setTheme()` updates the signal, writes to `localStorage`, and toggles the `dark` class on `document.documentElement`.

### Prior art
- `spinner.component.spec.ts` — existing ATL test using `renderWithProviders`.
- `error-banner.component.spec.ts` — existing ATL test, assertions via `getByRole('alert')`.
- `features/recipes/components/recipe-list.component.spec.ts` — pattern for testing dumb components with `componentInputs` and `on` callbacks.

---

## Out of Scope

- **E2E Storybook tests** — Playwright E2E tests for the Storybook instance are not included. Unit tests cover component behaviour; the Storybook build is validated by CI running `build-storybook` without errors.
- **Storybook publishing / hosting** — the static Storybook output will not be deployed to a public URL as part of this PRD.
- **ControlValueAccessor** — form-control components will not implement `ControlValueAccessor`. Integration with Angular's forms API is a future concern.
- **Animation library** — transitions use Tailwind utilities only; `@angular/animations` is not introduced.
- **Server-side rendering (SSR)** — no SSR considerations; `ThemeService` reads `localStorage` synchronously and is not SSR-safe. SSR support is a future concern.
- **i18n for component internals** — ARIA labels and any fixed strings in components (e.g. dialog close button tooltip) will use the existing `ngx-translate` pipe with keys added to `de.json`. No new i18n infrastructure is introduced.
- **Third-party component libraries** — Angular Material, PrimeNG, Ant Design, and similar libraries are explicitly excluded.
- **Refactoring existing features** to use new components — adoption by Recipes and other feature modules is a follow-on task, not part of this PRD.

---

## Further Notes

- The design source is the exported AppDock handoff bundle at `docs/design-prd/AppDock-handoff.tar.gz`. The file `appdock/project/component-library.html` is the authoritative visual spec. For any ambiguity about sizing, spacing, or colour, read that file first.
- The AppDock color ramp uses `warm-*` as the neutral prefix. Tailwind's closest built-in equivalent is `stone`, but the hex values differ enough to warrant adding the custom tokens. Do not substitute `stone` for `warm`.
- The `border-[3px]` value used by the medium spinner is an arbitrary Tailwind value. AGENTS.md forbids arbitrary values. Use `border-2` (2px) for `sm` and `border-4` (4px) for `md` and `lg` respectively, or revisit this constraint with the team.
- Storybook 8 requires Node 18+. Verify the CI environment meets this requirement before merging the Storybook configuration.
- The `app-icon` component uses `NgComponentOutlet` with `ngComponentOutletInputs`. This Angular 16+ feature is confirmed available in Angular 21. If a Lucide icon component does not declare `size` or `strokeWidth` as Angular inputs (they may use host bindings instead), fall back to wrapping the component with an `@HostListener` or switch to a `ViewContainerRef`-based dynamic render.
