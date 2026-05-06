# Component Library — Claude Design Prompt

**Design a high-fidelity component library prototype for Breadly**, a bread recipe management web app. The output should be precise enough for engineers to implement directly — include spacing, typography, and component states for every component. This is a standalone document; no prior context is required.

---

## Deliverables

For each component:
1. A dedicated frame showing all listed states side-by-side or grouped
2. Annotations directly on frames: spacing (px values), typography scale (Tailwind class names), and layout structure
3. A final **Component Overview** frame showing one representative instance of each component in a single grid

---

## Components

---

### 1. Badge

An icon with a circular count indicator anchored to its top-right corner.

**States to show:**
- Default (icon only, no indicator)
- With low count (`3`)
- With high count (`99+`)

**Specs:**
- Base icon: Lucide `Bell`, 24px
- Indicator pill: small circle overlapping top-right corner of the icon; white count text inside
- Indicator size: 18px diameter; font `text-xs font-medium`
- `99+` clips the count to fit

---

### 2. Button

Three visual variants, each shown in all interaction states.

**Variants:**
- **Primary** — filled, high-emphasis action
- **Secondary** — outlined/bordered, medium-emphasis
- **Transparent / Ghost** — no background or border, low-emphasis

**States per variant:** default, hover, focus, disabled, loading (spinner replaces or precedes label)

**Additional:**
- Show each variant with and without a leading Lucide `Plus` icon (16px)
- Button label examples: `"Rezept erstellen"` (primary), `"Abbrechen"` (secondary), `"Mehr anzeigen"` (ghost)
- Disabled state uses `opacity-50 cursor-not-allowed`
- Loading state inlines a small spinner (16px) to the left of the label

---

### 3. Checkbox

**States to show:**
- Unchecked: default, hover, focus
- Checked: default, hover, focus
- Indeterminate (dash icon, partial selection)
- Disabled unchecked
- Disabled checked
- Error: unchecked with red border + helper text below (`"Pflichtfeld"`)

**Specs:**
- Checkbox size: 16px × 16px, `rounded`
- Label: `text-sm text-gray-900`, 8px gap between checkbox and label
- Helper text: `text-xs`, 4px below checkbox row
- German label example: `"Schritt als aktiv markieren"`

---

### 4. Dialog (Modal)

A centered overlay modal with a dark semi-transparent backdrop.

**States to show:**
- **Default open:** title + body text + two action buttons (confirm + cancel)
- **Loading:** spinner centered in body area, action buttons disabled
- **Destructive action variant:** confirm button styled as danger (red), warning icon in header

**Specs:**
- Backdrop: `bg-black/50` full-screen overlay
- Modal container: `rounded-lg`, `shadow-xl`, white background, max-width `448px` on desktop
- Header: title `text-lg font-semibold text-gray-900` + Lucide `X` close button (top-right)
- Body: `text-sm text-gray-600`, padding `p-6`
- Footer: right-aligned action buttons with `gap-3`
- Mobile: modal fills viewport width minus `32px` margin (16px each side), close button retained
- Close interactions: backdrop click and ✕ button

**German examples:**
- Default title: `"Rezept löschen?"`
- Body: `"Diese Aktion kann nicht rückgängig gemacht werden."`
- Buttons: `"Löschen"` (danger) / `"Abbrechen"`

---

### 5. Dropdown (Form Select)

A custom-styled form select control.

**States to show:**
- Closed: default, hover, focus
- Open: options list visible below trigger
- Option row states: default, hover, selected (checkmark icon + emphasized text)
- Disabled (trigger grayed, not interactive)
- Error: red border on trigger + helper text below (`"Bitte wählen"`)

**Specs:**
- Trigger: full-width input row with label text left, Lucide `ChevronDown` icon right (16px); `rounded`; border `border-gray-300`
- Options list: `rounded-lg shadow-lg`, white background, `py-1`; floats below trigger; max 5 visible options before scroll
- Option row height: 36px, `px-3 text-sm`
- German example: `"Einheit"` selector with options `"Minuten"`, `"Stunden"`

---

### 6. FilterTag

Pill-shaped toggle chips used to filter or segment content. Tapping activates; tapping again deactivates.

**States to show:**
- Inactive: default, hover
- Active (selected): default, hover
- Disabled

**Specs:**
- Shape: `rounded-full`
- Padding: `px-3 py-1`
- Font: `text-sm font-medium`
- Inactive border: `border border-gray-300`, white background
- Active: filled primary-tinted background with primary text
- Group example: show three tags in a row — `"Alle"` (active), `"Aktiv"`, `"Warten"`

---

### 7. Headline (Typography Scale)

An annotated type specimen showing the full hierarchy.

**Levels to show:**

| Level | Tailwind Classes | px size |
|---|---|---|
| H1 | `text-4xl font-bold` | 36px |
| H2 | `text-2xl font-bold` | 24px |
| H3 | `text-xl font-semibold` | 20px |
| H4 | `text-lg font-semibold` | 18px |
| Body | `text-sm` (weight: regular) | 14px |
| Muted | `text-sm` (secondary color) | 14px |
| Caption | `text-xs` | 12px |

Annotate each level with its Tailwind class and rendered px size. Use German example content: `"Meine Rezepte"` (H1), `"Zutaten"` (H2), etc.

---

### 8. Icon

A reference grid of all Lucide icons used in the application.

**Icons to show:**
`Trash2`, `Plus`, `CircleUser`, `ChevronRight`, `ChevronDown`, `RefreshCw`, `Bell`, `X`, `Check`

**Size variants:**
- 16px — inline icons in buttons, list items
- 24px — standalone interactive icons
- 36px — avatar fallback, large placeholders

Annotate each icon with its Lucide name and rendered size. Show each icon on a white tile with its name label below.

---

### 9. Radio

A single radio button with label.

**States to show:**
- Unselected: default, hover, focus
- Selected: default, hover, focus
- Disabled unselected
- Disabled selected
- Error: red accent + helper text (`"Pflichtfeld"`)

**Specs:**
- Radio size: 16px × 16px, `rounded-full`
- Selected: filled inner dot (primary color)
- Label: `text-sm text-gray-900`, 8px gap
- German label: `"Aktiv"` / `"Warten"`

---

### 10. RadioGroup

A labeled group of radio buttons.

**States to show:**
- Default group: 3 options, one selected, one hovered, one disabled
- Error state: group-level error message below the last option

**Specs:**
- Group label: `text-sm font-medium text-gray-900`, `mb-2`
- Vertical stacking, `gap-2` between rows
- Error message: `text-xs` danger color, `mt-1`
- German example: group label `"Schritttyp"`, options `"Aktiv"`, `"Warten"`, `"Pause"` (disabled)

---

### 11. Segmented Button (Single Select)

A horizontal group of connected buttons where exactly one segment is always selected.

**Variants to show:**
- 2-segment example
- 3-segment example

**States to show (per variant):**
- Selected segment: filled primary background, white text
- Unselected segment: white background, bordered
- Hover on unselected
- All-disabled (entire group)

**Specs:**
- Segments share a continuous border; no gap between them; outer corners `rounded-lg`, inner segments no radius
- Font: `text-sm font-medium`
- German example: `"Aktiv"` / `"Warten"` (2-segment); `"Tag"` / `"Woche"` / `"Monat"` (3-segment)

---

### 12. Sidebar (Slide-over / Drawer)

An overlay panel that slides in from the right edge of the viewport.

**States to show:**
- **Closed:** page content visible, trigger button present (e.g. `"Filter"` button)
- **Open (desktop):** panel occupies right ~360px of viewport; rest of page dimmed with dark backdrop overlay; panel has `rounded-lg` on left edge, `shadow-xl`
- **Open (mobile):** panel fills full viewport width minus 48px left margin

**Panel anatomy (open state):**
- Header: title `text-lg font-semibold` + Lucide `X` close button flush right; `p-6 pb-4`, bottom border
- Content area: scrollable, `p-6`, `flex-1`
- Footer: sticky at bottom; two action buttons (`"Anwenden"` primary + `"Zurücksetzen"` ghost); `p-4 pt-0`

**German example:** drawer title `"Filter"`, content showing a FilterTag group and a Slider

---

### 13. Spinner

Animated loading indicator.

**Sizes to show:**
- Small — 16px (inline in buttons and tight spaces)
- Medium — 32px (section-level loading)
- Large — 48px (full-page loading state)

**Specs:**
- Circular arc using `animate-spin`, `border-2` or `border-4` depending on size
- Primary color: matches primary action color
- Annotate `animate-spin` on frame

---

### 14. Slider

A single-value range input.

**States to show:**
- Default (thumb at mid-point, e.g. 50%)
- Active / dragging (thumb slightly enlarged, track filled left of thumb)
- Disabled (track and thumb grayed)

**Specs:**
- Track height: 4px, `rounded-full`; filled portion uses primary color
- Thumb: 18px circle, white with border and shadow
- Value tooltip: small pill above the thumb showing current value
- Min / max labels: `text-xs text-gray-500` below track ends
- German example: label `"Hydration"`, range 0–100%, current value `75%`, tooltip shows `"75%"`

---

### 15. TabGroup

A horizontal row of tabs with an active indicator underline.

**States to show:**
- Active tab: primary underline border, primary text color
- Default (inactive) tab
- Hover on inactive tab
- Focus (keyboard) state
- Disabled tab (muted, non-interactive)

**Specs:**
- Tab row: `border-b border-gray-200`, full-width
- Active indicator: `border-b-2` in primary color, flush with the row border
- Tab font: `text-sm font-medium`
- Padding per tab: `px-4 py-2`
- German examples: `"Rezepte"`, `"Profil"`, `"Gesundheit"` (disabled)

---

### 16. Tag (Status Chip)

Non-interactive semantic status labels. Show all 5 variants.

| Variant | Example label |
|---|---|
| Success | `"Verifiziert"` |
| Danger | `"Fehler"` |
| Neutral | `"Entwurf"` |
| Disabled | `"Inaktiv"` |
| Information | `"Information"` |

**For each variant, show two forms:**
- With leading dot indicator (4px circle)
- Without dot indicator (text only)

**Specs:**
- Shape: `rounded` (4px), padding `px-2 py-0.5`
- Font: `text-xs font-medium`
- Dot: 4px circle, vertically centered, 4px gap before text

---

### 17. Toggle (Switch)

A binary on/off switch with an optional label.

**States to show:**
- Off: default, hover, focus
- On: default, hover, focus
- Disabled off
- Disabled on

**Two layout variants:**
- Label on the right
- Label on the left

**Specs:**
- Track: 36px × 20px, `rounded-full`; off = `gray-300`; on = primary color
- Thumb: 16px circle, white, offset 2px from edge; transitions smoothly between positions
- Label: `text-sm text-gray-900`, 8px gap
- German example: `"Benachrichtigungen aktivieren"`

---

## Component Overview Frame

A final summary frame arranged in a grid: one representative instance of each of the 17 components. Label each cell with the component name. Use default/resting state only.
