---
name: appdock-design
description: Use this skill to generate well-branded interfaces and assets for AppDock and its sub-brand Breadly, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map of this skill

- `README.md` — full system overview, content fundamentals, visual foundations, iconography rules, component vocab, file index, caveats.
- `colors_and_type.css` — drop-in CSS variables: amber + warm-gray ramps, semantic tokens (light + dark), spacing/radii/motion tokens, base type styles. Geist + Geist Mono via Google Fonts.
- `components.css` — primitive component classes: `.ad-btn` (primary/ghost/quiet, sm/md/lg), `.ad-input`, `.ad-card`, `.ad-pill`, `.ad-dock` + `.ad-dock-icon`, `.ad-dock-placeholder`, `.ad-phasebar`, `.ad-drawer`, `.ad-wheat-stroke`.
- `assets/` — `appdock-mark.svg`, `appdock-wordmark.svg`, `breadly-loaf.svg`, `breadly-wordmark.svg`. The loaf is the only custom illustration.
- `preview/*.html` — small focused cards (palettes, type specimens, components, motion). Useful as ready-made specimens to copy into a doc.
- `ui_kits/_shared/components.jsx` — React primitives (`Button`, `Input`, `Pill`, `Card`, `DockBar`, `TopBar`, `AppDockMark`, `BreadlyLoaf`, `Icon`).
- `ui_kits/appdock-shell/` — login, launcher, account, app-frame screens. Always start product mocks here for shell chrome.
- `ui_kits/breadly/` — recipe list, scheduler (phase bars + live tick + ready ripple + drawer), add-recipe flow with hydration calculator, empty state.

## Hard rules to keep

- Two font weights only: 400 and 500. Never heavier, never italic in chrome.
- No gradients, no decorative shadows, no background images. The only patterned/decorative element is the flat 3 px amber-600 stripe on Breadly recipe cards.
- Amber-500 = AppDock shell accent. Amber-600 = Breadly. New apps must pick a non-amber accent.
- Every state change has motion (150–220 ms small UI, 300–400 ms page-level). Never `linear`. Wrap keyframes in `@media (prefers-reduced-motion: no-preference)`.
- Touch targets ≥ 44 × 44.
- Sentence case everywhere. No emoji in product copy. Icons are Lucide via CDN at 1.5 stroke.
- Dark mode is mandatory — `[data-theme="dark"]` flips every token cleanly.

## Starting a new artifact

1. Link `colors_and_type.css` and (if components needed) `components.css`.
2. Use `Geist` for everything; `Geist Mono` for any numeric readout.
3. Compose with the React primitives in `_shared/components.jsx` when building React; otherwise use the `.ad-*` classes directly.
4. If you need a new icon, use Lucide. If you need an illustration, use the loaf SVG or ask before drawing anything new.
