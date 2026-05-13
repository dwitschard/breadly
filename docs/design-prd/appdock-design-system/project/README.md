# AppDock Design System

A unified design system for **AppDock** — a single-login dock for home-focused applications — and its first sub-brand **Breadly**, a sourdough-recipe and bake-scheduling app.

> *AppDock is the kitchen counter. Breadly is the warm oven on it.*

---

## 1. Products in this system

| Product | Role | Accent | Personality |
|---|---|---|---|
| **AppDock (shell)** | The dock bar, login, account, app switcher — one identity that hosts every app. | Amber **#F59E0B** (amber-500) | Calm, organized, ready. A clean counter. |
| **Breadly** | First sub-brand. Bread recipes + bake scheduling that counts backward to a "ready by" time. | Amber-wheat **#D97706** (amber-600) | Warm, patient, smells like sourdough. |

Future apps inherit AppDock's warm-neutral shell and bring their **own** accent ramp + personality metaphor. Amber is reserved for Breadly.

## 2. Sources used to build this system

- **Brief** — written product description provided by the user (the canonical source).
- **`uploads/Master Arbeit.pdf`** and **`uploads/Master Arbeit Präsentation.pdf`** — *unrelated.* These are a German-language master's thesis on temporary urban uses ("Zwischennutzungen im städtischen Kontext") and were attached to the project but contain no AppDock material. Left in `uploads/` for reference; not used in the system.
- No Figma file, codebase, or screenshots were provided. **The visual language in this system is built from the written brief.** When more source material arrives (real screenshots, Figma, Tailwind config), the tokens here are designed to be a drop-in match — Tailwind-aligned amber/warm scales, Geist/Geist Mono fonts.

---

## 3. Content fundamentals

The voice across both surfaces is **calm, plainspoken, and quietly warm** — the way a good appliance speaks. Never cute, never breathless. No exclamation points unless something has actually finished baking.

### Tone & address

- **Second person ("you"), present tense.** *"Set a ready-by time."* Not *"Users can set..."*
- **Imperative for actions.** *"Add a recipe."* *"Start the bake."*
- **Sentence case everywhere** — buttons, labels, page titles. Never Title Case. Never ALL CAPS except the eyebrow micro-label class.
- **First person plural ("we") only in moments of warmth or completion.** *"Let's bake something."* *"We'll let you know when it's ready."*

### Casing & punctuation

- Sentence case for all UI text.
- No trailing periods on standalone labels, button text, or pill content.
- Periods only in full sentences (descriptions, empty-state copy, tooltips with two clauses).
- En-dashes for ranges (`60 – 75 % hydration`, `9:00 – 10:30`), em-dashes for asides.
- Numbers: digits, not words (`2 loaves`, not *two loaves*). Use thin space before `%` only in the hydration calculator readout.

### Specific examples

| Surface | ✅ Use | ❌ Avoid |
|---|---|---|
| Empty state | "No recipes yet. Let's bake something." | "You haven't added any recipes! 🍞 Click below to get started!!" |
| Primary button | "Start bake" | "BAKE NOW" |
| Phase label, idle | "Bulk ferment · 4 h" | "BULK FERMENTATION (4 hours)" |
| Phase label, live | "Bulk ferment · 2 h 14 m left" | "Bulk fermentation in progress — 2 hours, 14 minutes remaining" |
| Ready moment | "Ready" | "Done! 🎉🎉" |
| Login | "Sign in to AppDock" | "Welcome back, friend!" |
| Error | "We couldn't save that. Try again?" | "ERROR: Save failed." |
| Coming-soon dock slot | "More apps coming soon" | "🚀 New apps launching!" |

### Emoji & icons in copy

- **No emoji in product copy.** Ever. The only "icon-in-prose" allowed is the middle dot `·` as a metadata separator (`Sourdough · 75% hydration · 850 g`).
- Iconography is delivered through Lucide SVGs (see `ICONOGRAPHY` below), never Unicode glyphs.

### Vibe

> Imagine the recipe is on a card, the timer is on the wall, and the kitchen is quiet. The app's job is to disappear when it's working and to arrive gently when there's something to do.

---

## 4. Visual foundations

### Palette

- **Warm neutrals** are the backbone: warm whites and warm grays with a slight yellow bias (oklch hue ~75°, never blue-cool). Light mode sits on `--warm-50` (`#FAF8F5`); dark mode on `--warm-950` (`#0F0E0D`).
- **Amber ramp** is the only accent. AppDock uses amber-500; Breadly steps one rung deeper to amber-600. Buttons, focus rings, active dock states, ready-moment fills all sit on this single ramp — there are no secondary accents.
- **Cool slate** appears *exclusively* on cold-retard / fridge phase bars in Breadly's scheduler. Slate is a phase-coding signal, not a UI color.
- **No gradients.** Anywhere. Phase-bar fills are flat amber. The "ready" ripple is a single-color radial fade in opacity, not a hue shift.
- **Imagery vibe:** when imagery eventually exists (recipe photos, hero shots), it should be **warm, naturally lit, slight grain, never cool or saturated**. Think morning light on flour.

### Typography

- **Geist** (sans) for everything. **Geist Mono** for numerical readouts (countdowns, hydration %, weights).
- **Two weights only — 400 and 500.** Headings are 500, body is 400, labels are 500. No 600+, no italics in UI chrome.
- Letter-spacing tightens as size grows (`-0.02em` on h1/display). Eyebrow micro-labels use `+0.08em` and uppercase.
- `text-wrap: pretty` on body copy.

### Spacing & layout

- 4px grid. Tokens `--space-1` through `--space-24`.
- **Generous whitespace.** Cards have 20px internal padding. Page gutters are 24px on mobile, 48px on desktop. Section spacing is 64px+.
- Density is *low* by default. We err toward fewer rows with more breathing room.
- **Touch targets minimum 44×44.** Dock icons are exactly 44×44. Buttons are 40 (default), 32 (sm), or 48 (lg) tall.

### Backgrounds

- Plain flat surfaces. `--bg` (page) and `--bg-elevated` (cards) — that's it.
- **No background images, no full-bleed photos, no repeating patterns** in shell chrome. The only decorative element is Breadly's recipe-card top edge: a flat 3px amber-600 stripe at 0.85 opacity. It's a quiet brand cue, not a texture.
- No glassmorphism, no blurs, no transparency in surface backgrounds. Drawers and modals are solid.

### Borders

- 1px borders, never 2px. Color is `--border` (warm-200 / warm-800 dark). On amber-tinted surfaces use `--border-accent` (amber-200).
- Phase bars and pills use **no border**, just a fill.
- Focus states are a 2px outline with 2px offset in `--accent-ring` — outside the element, not replacing the border.

### Shadows

- **No decorative shadow layers.** Cards are flat: 1px border + flat fill.
- Two exceptions, both functional:
  - `--shadow-focus` — focus ring stack for keyboard nav.
  - `--shadow-drawer` — soft top-edge shadow under drawers and modals only, to lift them off the page.

### Corner radii

- 12px cards · 8px controls (buttons, inputs) · 6px phase bars · 20px modals & drawers (top corners) · 99px pills & dock-icon active backgrounds · 4px small chips.

### Motion

- **Every state change has motion.** No instant jumps.
- **Durations:** 80ms (countdown tick) · 150ms (hover/press) · 220ms (drawer, page-level small) · 400ms (page cross-fade) · 600ms (ready ripple).
- **Easing:** never `linear`. Default is `cubic-bezier(0.4, 0, 0.2, 1)`. Drawer slide-in uses `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Hover** = `scale(1.03)` + border brightening on dock icons, gentle background tint on buttons. No opacity tricks.
- **Active/press** = `scale(0.97)` + slight darken via `--accent-press`. Springs back on release.
- **Active dock icon** = `scale(1.06)` + amber underline + amber-tinted bg.
- **Heartbeat** on "coming soon" dock slot — 1800ms scale + opacity loop on a dashed amber ring.
- **Countdown tick** — `transform: scale(1.02)` for 80ms ease-out, every second, on the live readout inside an active phase bar.
- **Ready ripple** — 600ms radial expand, opacity 0.4 → 0, from the bar's right endpoint.
- All keyframe animation gated behind `@media (prefers-reduced-motion: no-preference)`. Transitions on hover/press still run (they're sub-perceptual).

### Transparency & blur

- Reserved for **scrim overlays only** (modal backdrop = `rgba(28, 25, 23, 0.5)`, no blur). UI surfaces themselves are always solid.

### Cards

- Background: `--bg-elevated`. Light mode: `--warm-25` (off-off-white). Dark mode: `--warm-900`.
- Border: 1px `--border` (or `--border-accent` for amber-tinted Breadly recipe cards).
- Radius: 12px.
- **No shadow.** Padding: 20px. Internal element gap: 12px.
- Breadly recipe card = same skeleton + amber-50 background (warm-800 dark) + 3px flat amber-600 top-edge stripe.

### Layout rules / fixed elements

- **Dock bar** is always visible — bottom-fixed on mobile, top-fixed on desktop, with 16px page gutter and 8px internal padding.
- The dock and the user's app frame *don't share chrome* — the dock floats on its own pill surface; the active app paints inside the remaining viewport.
- Drawers slide from the bottom and never exceed 85% of viewport height.

### Dark mode

Mandatory. Every token has a dark counterpart in `colors_and_type.css`. Amber stays vibrant (we step one shade lighter for hover in dark to compensate for surrounding warm-blacks). Cool slate desaturates slightly. Borders are `--warm-800` — visible but quiet.

---

## 5. Iconography

- **Library: [Lucide](https://lucide.dev) via CDN.** 24×24 viewbox, 1.5px stroke (changed from default 2 — feels lighter/warmer at our type weights), `stroke-linecap="round"`, `stroke-linejoin="round"`. Imported in UI kits as `<i data-lucide="…"></i>` then hydrated by `lucide.createIcons()`.
- **Why Lucide:** open-source, comprehensive, line-only, and the rounded stroke caps match our 8/12/20px radii vocabulary. No filled icons in the system.
- **No emoji** in UI surfaces, ever. (Emoji in user-generated content like recipe notes is fine — that's the user's voice, not ours.)
- **No Unicode glyphs as icons** (no ✓ ✗ ★). Always a Lucide SVG. Exception: middle-dot `·` as a *metadata separator* in plain text strings.
- **Color:** icons inherit `currentColor`, so they take the parent's text color. In dock icons that's `--fg-muted` (idle) or `--accent-press` (active). On amber buttons they're `--fg-on-accent`.
- **Sizing:** 16px (inside pills/badges), 20px (inputs, buttons), 24px (dock & nav), 32px (empty states & illustrations).
- **The Breadly loaf glyph** is a hand-authored 2-arc SVG in `assets/breadly-loaf.svg` — used in empty states, the Breadly app icon, and the dock placeholder. It is the *only* custom illustration in the system.
- **The AppDock dock glyph** is in `assets/appdock-mark.svg` — a stylized rounded-rectangle "tray" with three slots.

When more icons are needed and Lucide doesn't have a matching one, prefer requesting a Lucide PR or a Figma export over inventing a new house style.

---

## 6. Component vocabulary (quick reference)

| Component | Spec |
|---|---|
| Card | radius 12px · 1px border (amber-200 light / warm-700 dark) · no shadow · 20px padding |
| Button (primary) | amber-500 bg · amber-950 text · radius 8px · scale(0.97) on press · 40px tall |
| Button (ghost) | transparent bg · amber-600 border · amber-700 text · radius 8px |
| Input | radius 8px · 1px border · 2px amber-400 focus ring at 2px offset |
| Pill / badge | radius 99px · amber-100 bg · amber-800 text · 22px tall · 12px text |
| Phase bar | radius 6px · full-width · 40px tall · flat amber (warm) or slate (cold) fill |
| Modal / drawer | top corners radius 20px · slide-up 220ms `cubic-bezier(0.22,1,0.36,1)` |
| Dock icon | 44×44 · radius 8px · idle muted, hover scale 1.03, active scale 1.06 + amber tint + underline |
| Focus ring | 2px solid `--accent-ring` outline · 2px offset · works on any element |

---

## 7. Repository index

```
/
├── README.md                  ← you are here
├── SKILL.md                   ← skill manifest (Claude Code-compatible)
├── colors_and_type.css        ← all design tokens + base type
├── components.css             ← buttons, inputs, dock, phase bars, drawer
│
├── assets/                    ← logos, brand SVGs, the loaf glyph
│   ├── appdock-mark.svg
│   ├── appdock-wordmark.svg
│   ├── breadly-loaf.svg
│   └── breadly-wordmark.svg
│
├── fonts/                     ← (Geist & Geist Mono are loaded from Google Fonts CDN; no local files yet)
│
├── preview/                   ← Design System tab cards (small, focused HTML files)
│
├── ui_kits/
│   ├── appdock-shell/         ← dock bar, login, account, app switcher
│   │   ├── README.md
│   │   ├── index.html
│   │   └── *.jsx
│   └── breadly/               ← recipe list, scheduler, add-recipe flow, empty state
│       ├── README.md
│       ├── index.html
│       └── *.jsx
│
└── uploads/                   ← original user uploads (unrelated PDFs)
```

---

## 8. Caveats & known substitutions

- **Geist** is loaded from Google Fonts CDN. If the brand has licensed a different specimen (Söhne, Inter Display, Aeonik, etc.), swap the `@import` in `colors_and_type.css` and the `--font-sans` token. **The whole system is gated on two weights — keep that constraint when swapping.**
- **Lucide** is the icon set chosen as the closest match to "modern, minimal, warm, line-based, 1.5px stroke." If the brand has a custom icon set, drop it into `assets/icons/` and update the `ICONOGRAPHY` rules.
- **Dark mode amber** uses the same ramp at unchanged values — verified visually for contrast on warm-950 surface, but not formally APCA-tested. Worth a contrast pass when more screens land.
- **No real product imagery** exists yet. Recipe-card photo slots in the Breadly UI kit show neutral placeholder fills with the wheat stroke as a visual stand-in.
