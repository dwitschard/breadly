# Hi-Fi Prototype — Claude Design Prompt

**Design a high-fidelity, developer-handoff prototype for Breadly**, a bread recipe management web app. The output should be precise enough for engineers to implement directly — include spacing, typography hierarchy, color tokens, and component states.

---

## Tech & Visual Constraints

- **Color palette:** AppDock Design System tokens (warm-biased, amber accent). Primary actions use `amber-600` (#D97706) / `amber-700` (#B45309). Text on amber buttons: `amber-950` (near-black). Surfaces: `warm-25` (#FDFCFA) for cards/panels, `warm-50` (#FAF8F5) for page background. Text: `warm-900` (#1C1917) primary, `warm-600` (#57534E) muted, `warm-500` (#78716C) secondary. Borders: `warm-200` (#E9E4DC). Focus ring: `amber-400` (#FBBF24). Success: `#65A30D` / `#ECFCCB`. Error/Danger: `red-500` (#DC2626) / `red-50` (#FEF2F2). Baking timeline — active steps: `amber-700` fill on `amber-100` track; wait/passive steps: `slate-600` (#4B5868) fill on `slate-100` (#E6EAEE) track.
- **Typography:** Geist 400/500 from Google Fonts (`@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=swap')`). Two weights only: 400 (body) and 500 (labels/headings). Monospace: Geist Mono for tokens, IDs, metadata.
- **Icons:** Lucide Icons at 1.5px stroke width. Trash2 for delete, Plus for add, CircleUser for avatar fallback, ChevronRight/ChevronDown for expand/collapse, RefreshCw for reload, Bell for notifications, X for close, Check for confirmation.
- **No images or photography** in recipe cards.
- **Language:** German. All UI labels and placeholder text must use German (see label examples below).
- **Border radius:** 4px (`--radius-xs`) for inputs, badges, tags. 12px (`--radius-lg`) for cards and panels. 20px (`--radius-2xl`) for modals and drawers.

---

## Component Library

**All screens must be assembled exclusively from the Breadly component library.** The library was designed in Claude Design and is the authoritative visual reference:

- **URL:** https://api.anthropic.com/v1/design/h/kh-MpazQXLZnpuD56MmjCw?open_file=component-library.html
- **Design bundle README:** `appdock/README.md` — read the chat transcript in `appdock/chats/` for design intent, then read `component-library.html` top to bottom before designing any screen.

Do not invent a new visual pattern if an existing library component covers the use case.

### Available Components

| # | Component | Use in this app |
|---|---|---|
| 1 | Badge | Notification bell in navbar with count overlay |
| 2 | Button (Primary / Secondary / Ghost) | All CTAs, submit, cancel, reload, add-step |
| 3 | Checkbox | Step checkboxes if needed |
| 4 | Dialog (Modal) | Confirmation overlays |
| 5 | Dropdown | Unit selector (min/h) in step builder; profile dropdown menu |
| 6 | FilterTag | Step type filter; future recipe filtering |
| 7 | Headline (Typography Scale) | All headings and body text — use exact Tailwind classes from spec |
| 8 | Icon | Trash2, Plus, CircleUser, ChevronRight/Down, RefreshCw, Bell, X, Check |
| 9 | Radio | Single radio option |
| 10 | RadioGroup | Step type selector (Aktiv / Warten) |
| 11 | Segmented Button | Step type toggle: *"Aktiv"* / *"Warten"* (2-segment) |
| 12 | Sidebar (Drawer) | Future filter panel |
| 13 | Spinner | All loading states (16px inline, 32px section, 48px full-page) |
| 14 | Slider | Hydration input (slider variant) |
| 15 | TabGroup | Top-level navigation tabs |
| 16 | Tag (Status Chip) | Hydration % badge; role chips (ADMIN/USER); verification status; health status |
| 17 | Toggle | Step type binary switch alternative |

### New Components Rule

If a screen requires a visual element not covered by any of the 17 components above, **design it fully** (all states, spacing, colors) and append it under `## New Components` at the end of this document. These designs will be reviewed and added to the component library later.

Components anticipated to be missing from the library (design these as new):

- **FormField** — text/number input with floating or top-aligned label, optional suffix (% or unit text), focus ring (`amber-400`), error state (red border + *"Pflichtfeld"* helper text below)
- **BakingTimeline** — full-width horizontal segmented bar; active steps use `amber-700` fill on `amber-100` track, wait/passive steps use `slate-600` fill on `slate-100` track; step name labels below each segment
- **EnvironmentBadge** — pill in navbar; green = *Lokal*, orange = *Dev*, blue = *Staging*
- **SkeletonRow** — animated pulse placeholder row for recipe list (gray bars for name and stats columns)
- **ErrorBanner** — red-bordered alert strip (*"Fehler beim Laden der Rezepte."*) with inline retry link

---

## Screens to Design (Responsive: Desktop 1280px + Mobile 375px)

---

### 1. Home Page (`/`)

**Purpose:** Landing page for unauthenticated users with a login CTA.

**Content:**
- Centered layout
- App name: **"Breadly"**
- Tagline: *"Deine Rezepte. Dein Brot."*
- Primary CTA button: *"Anmelden"* (blue-600)

**States to show:**
- Default (unauthenticated)

**Components used:** Button (Primary) for *"Anmelden"* CTA.

---

### 2. Recipes Page (`/recipes`) — Priority Screen

**Layout:** Single-column centered content (max-w-2xl), top navbar, recipe list below a creation form.

#### 2a. Recipe Create Form (top of page)

A multi-field form for adding a new recipe. Fields:

| Field | Type | German label |
|---|---|---|
| Name | Text input | *"Rezeptname"* |
| Hydration | Number input + % suffix | *"Hydration"* |
| Steps | Dynamic step builder | *"Schritte"* |

**Step builder:** Each step has:
- Step name (text input), e.g. *"Mischen"*, *"Stockgare"*, *"Formen"*, *"Stückgare"*, *"Backen"*
- Duration (number input + unit selector: min / h)
- Step type toggle: Aktiv (the baker does something) vs. Warten (passive wait)
- Add step button (*"+ Schritt hinzufügen"*)
- Remove step button (Trash2 icon per row)

Submit button: *"Rezept erstellen"* (amber-600, disabled when name is empty)

**States to show:**
- Default (empty form)
- Partially filled (show disabled vs. enabled submit)
- Validation error (required field empty, highlighted with red border + message *"Pflichtfeld"*)

**Components used:** FormField (new) for name and hydration inputs; Segmented Button for Aktiv/Warten step type toggle; Dropdown for unit selector (min/h); Button (Ghost) for *"+ Schritt hinzufügen"*; Icon (Trash2, 16px) for remove step; Button (Primary, disabled state) for submit.

#### 2b. Recipe List

**Expandable list rows.** Each row:

**Collapsed state:**
- ChevronRight icon + Recipe name (left)
- Hydration % badge (e.g. `75%`) + total duration (e.g. `8h 30min`) (right)
- Trash2 delete button (far right, `text-gray-400 hover:text-red-600`)

**Expanded state** (click row to expand):
- ChevronDown icon + Recipe name (left, same row)
- Stats bar below: Hydration % and total duration
- **Baking timeline visualization:** Horizontal bar spanning full width. Each step is a labeled segment. Use two visual treatments:
  - Active steps (baker works): Solid `blue-600` bar segment
  - Wait steps (passive): Lighter `blue-200` / `gray-200` bar segment with a hatched or dashed texture
  - Below the bar: Step name labels aligned to each segment
  - Example sequence: `[Mischen 30min][Autolyse 1h][Falten 10min][Stockgare 4h][Formen 20min][Stückgare 8h][Backen 45min]`
- Delete button remains visible

**List states to show:**
- **Loading:** Skeleton rows (3 placeholder rows with animated pulse, gray bars for name and stats)
- **Empty:** Centered empty state with icon and text *"Noch keine Rezepte vorhanden. Erstelle oben ein neues."*
- **Error:** Red error banner at top (*"Fehler beim Laden der Rezepte."*) with a retry link
- **Populated:** At least 2-3 example recipes; show one collapsed, one expanded with the timeline
- **Delete confirmation:** Inline confirmation (replace delete icon with *"Löschen?"* + confirm/cancel) — no modal

**Interactive states:**
- Row hover: `warm-50` background highlight
- Delete button hover: `red-500` text
- Submit button: hover `amber-700`, focus ring `amber-400`, disabled `opacity-50 cursor-not-allowed`
- Input focus: `ring-2` with `amber-400` focus ring, `amber-600` border

**Components used:** Icon (ChevronRight/ChevronDown, Trash2) for row controls; Tag (Status Chip) for hydration % badge; BakingTimeline (new) in expanded state; Spinner (32px) for loading state; SkeletonRow (new) for skeleton placeholders; ErrorBanner (new) for error state.

---

### 3. Profile Page (`/profile`)

**Layout:** Centered card, definition list structure.

**Content:**
- Avatar (circular image or CircleUser icon fallback)
- Full name (heading)
- Definition list rows:
  - *"E-Mail"*: email + verification badge (green *"Verifiziert"* or yellow *"Nicht verifiziert"*)
  - *"Nutzer-ID"*: sub claim (monospace, truncated)
  - *"Rollen"*: blue badge chips per role (e.g. `ADMIN`, `USER`)

**States:** Loading skeleton, populated with admin user (showing ADMIN badge)

**Components used:** Icon (CircleUser, 36px) for avatar fallback; Tag (Success) for *"Verifiziert"* badge, Tag (Warning/neutral) for *"Nicht verifiziert"*; Tag (primary tint) for role chips (ADMIN, USER); Spinner (48px) for loading state.

---

### 4. Health Page (`/health`) — Admin Only

**Layout:** Centered, two-column card grid.

**Content:**
- Section heading: *"Systemstatus"*
- Cards for: API Status, Datenbank Status
  - Green dot + *"OK"* + response time, or Red dot + *"Fehler"*
- Reload button: *"Neu laden"* (outline style)
- Version section: Frontend and backend version numbers with GitHub links

**States:** Loading (spinner in each card), healthy state, degraded state (DB red)

**Components used:** Button (Secondary/outline) for *"Neu laden"*; Spinner (32px) for card loading state; Tag (Success) for *"OK"* status, Tag (Danger) for *"Fehler"* status.

---

## Navbar (appears on all authenticated pages)

- Left: App name *"Breadly"* (bold, gray-900)
- Center/Right nav links: *"Rezepte"*, *"Gesundheit"* (admin only)
- Far right: Profile avatar button → dropdown menu with *"Profil"*, *"Gesundheit"* (if admin), *"Abmelden"*
- Active link indicator: `amber-600` underline or bold
- Environment badge (pill): green=Lokal, orange=Dev, blue=Staging

**Components used:** Badge (with Bell icon) for notification count in navbar; Dropdown for profile avatar menu; EnvironmentBadge (new) pill; Button (Ghost) for nav links.

---

## Deliverables

For each screen, provide:
1. Desktop frame (1280px)
2. Mobile frame (375px)
3. All listed component states as separate frames or annotated overlays
4. A component legend frame showing isolated states: buttons (default/hover/focus/disabled), inputs (default/focus/error), badges, status indicators, skeleton, error banner

Annotate spacing (px values), color tokens (Tailwind class names), and typography scale directly on the frames.

---

## New Components

> **Instructions for designers:** If a screen in this document requires a component not found in the Breadly component library, design it fully here — all states, spacing, and color tokens — using the same frame/annotation format as the library. Each entry will be reviewed and added to the official library.

The following components are anticipated and should be designed as part of this deliverable:

### FormField
A labeled text or number input with optional suffix and validation state.

- **States:** Default, focus (amber-400 ring), error (red-500 border + *"Pflichtfeld"* helper text below), disabled
- **Variants:** Plain text, number with suffix (e.g. `%`, `min`, `h`), number with unit Dropdown inline
- **Specs:** Label `text-sm font-medium warm-900` above input; input height 40px, `border warm-200`, `rounded-xs` (4px); focus `ring-2 amber-400`; error helper `text-xs red-500` 4px below input

### BakingTimeline
Full-width horizontal bar visualizing a recipe's baking steps in sequence.

- **States:** Default (all steps visible), hover per segment (tooltip with step name + duration)
- **Active step segments:** `amber-700` fill, `amber-100` track background, solid bar
- **Wait/passive step segments:** `slate-600` fill, `slate-100` track background, optional hatched texture
- **Below bar:** Step name labels (`text-xs warm-500`) aligned to segment start; duration below name
- **Specs:** Bar height 12px, `rounded-sm` (6px) on outer ends; total width 100% of container; labels in `Geist Mono`

### EnvironmentBadge
Pill badge in the navbar showing the current deployment environment.

- **Variants:** Lokal (green background), Dev (orange/amber background), Staging (blue background), Prod (hidden / not shown)
- **Specs:** `rounded-pill` (99px), `px-2 py-0.5`, `text-xs font-medium`; color per variant using semantic success/warn/info ramp

### SkeletonRow
Animated placeholder row mimicking a collapsed recipe list item during loading.

- **Specs:** Same height as a collapsed recipe row; contains two gray pulse bars — one wide (recipe name, ~40% width) and one narrow (stats, ~20% width, right-aligned); background `warm-200`, animation `animate-pulse`

### ErrorBanner
Full-width red alert strip shown when a data fetch fails.

- **States:** Default (error message + retry link), dismissible (with X close button)
- **Specs:** `border border-red-200 bg-red-50 rounded-lg px-4 py-3`; message `text-sm red-700`; retry link `text-sm font-medium red-700 underline`; icon `AlertCircle` 16px left of message
