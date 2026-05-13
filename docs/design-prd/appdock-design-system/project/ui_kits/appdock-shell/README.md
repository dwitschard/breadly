# AppDock Shell — UI kit

The "kitchen counter" — every app lives inside this chrome.

## Surfaces in this kit
- **Login** — minimal, branded, sentence-case copy. One amber CTA.
- **Launcher** — your apps as cards plus a heartbeat "coming soon" tile.
- **Account** — identity + connected apps + preferences.
- **App frame** — placeholder when the dock hands viewport to a sub-brand.
- **TopBar + DockBar** — the persistent shell chrome. Dock is bottom-fixed pill, 44×44 icons, amber underline + tinted bg + scale(1.06) on active.

## Files
- `index.html` — runnable click-thru: launcher → app, launcher → account, sign-out → login.
- `Screens.jsx` — `LoginScreen`, `LauncherScreen`, `AccountScreen`.
- Shared primitives live in `../_shared/components.jsx` (Button, Input, Pill, Card, DockBar, TopBar, AppDockMark, BreadlyLoaf, Icon).

## What to copy
- For a new sub-brand: import `DockBar` + `TopBar` and wrap your app's content. Don't re-style them.
- For login or account inside any app, reuse `LoginScreen` / `AccountScreen` directly.
