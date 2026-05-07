# Breadly — Database Schema

This document describes the data model for **Breadly**, a bread-recipe database. It is derived from the ERD diagram and is intended as a reference for working with the schema (e.g., for Claude when generating queries, code, or migrations).

> **Notation**
> - Field types are taken verbatim from the ERD (`Short text`, `Long text`, `Rich text`, `Integer`, `Decimal`, `Boolean`, `Date & time`, `File`, `Array`, `Reference`).
> - `Reference` = single foreign key to another entity.
> - `References, many` = many-to-many or one-to-many collection of foreign keys.
> - Fields/relations marked **(inferred)** are *not* drawn in the ERD but are added as reasonable assumptions for a real database (primary keys, inverse relations). They are clearly labeled.

---

## Entity Overview

| Entity | Purpose |
|---|---|
| `Rezept` | A bread recipe (top-level entity). |
| `Stufe` | A stage of a recipe (e.g. preferment, main dough). Holds ingredients, steps, and proofing processes. |
| `Zutat` | An ingredient used in a stage. |
| `Mehl` | A flour type (referenced by ingredients and dough-temperature presets). |
| `Teigtemperatur` | Temperature targets for a dough, depending on flour and leavening agent. |
| `Schritt` | A single instruction step within a stage. |
| `Garprozess` | A proofing/fermentation process (Stockgare = bulk ferment, Stückgare = final proof). |
| `Backvorgang` | A baking phase (oven setting, temperature, steam, etc.). |
| `Dauer` | A duration range (min/max in hours and minutes). |
| `Menge` | A quantity/yield description for a recipe. |
| `Ursprung` | The origin of a recipe (book, website, video, …). |
| `Bewertung` | A rating/review of a recipe. |

---

## Entities

### Rezept (Recipe)

The top-level entity representing a bread recipe.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Titel` | Short text | Recipe title. |
| `Description` | Rich text | Description of the recipe. |
| `Bild` | File | Image of the bread. |
| `Vostufen` | References, many → `Stufe` | Pre-stages (preferments, soakers, etc.). |
| `Hauptteig` | Reference → `Stufe` | The main dough stage (single). |
| `Backvorgänge` | References, many → `Backvorgang` | Baking phases for this recipe. |
| `Menge` | Reference → `Menge` | Yield / quantity info. |
| `Bewertung` | Integer | Aggregate rating on the recipe itself (e.g. 1–5). |
| `Ursprung` | Reference → `Ursprung` | Where the recipe comes from. |
| `Original` | Reference → `Rezept` *(self-reference)* | If this recipe is a variant/fork of another, points to the original. |
| `Bewertungen` | References, many → `Bewertung` | Individual ratings/reviews. |

---

### Stufe (Stage)

A stage of a recipe — either a pre-stage (Vorstufe) or the main dough (Hauptteig).

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Sortierung` | Integer | Sort order within the recipe. |
| `Name` | Short text | Stage name (e.g. "Sauerteig", "Hauptteig"). |
| `Typ` | Short text | Stage type. |
| `Zutaten` | References, many → `Zutat` | Ingredients in this stage. |
| `Schritte` | References, many → `Schritt` | Ordered steps in this stage. |
| `Stockgare` | References, many → `Garprozess` | Bulk fermentation process(es). |
| `Stückgare` | References, many → `Garprozess` | Final proofing process(es). |

**Inverse relations *(inferred)*:**
- Used by `Rezept.Vostufen` (many) and `Rezept.Hauptteig` (single).

---

### Zutat (Ingredient)

A single ingredient used inside a stage.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Name` | Short text | Ingredient name. |
| `Typ` | Array | Ingredient type/categories (multi-valued). |
| `Menge In Gramm` | Decimal | Amount in grams. |
| `Mehl` | Reference → `Mehl` | If this ingredient is a flour, the flour record (nullable for non-flours). |
| `Schütttemperatur` | Integer | Target water/liquid temperature for mixing. |
| `Alternative` | Reference → `Zutat` *(self-reference)* | An alternative/substitute ingredient. |

**Inverse relations *(inferred)*:**
- Used by `Stufe.Zutaten` (many).

---

### Mehl (Flour)

A flour type catalogue entry.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Sorte` | Short text | Flour variety (e.g. "Weizen", "Roggen"). |
| `Typ` | Integer | Flour type number (e.g. 550, 1050). |
| `CH Beschreibung` | Short text | Swiss-equivalent designation/description. |

**Inverse relations *(inferred)*:**
- Referenced by `Zutat.Mehl` (many).
- Referenced by `Teigtemperatur.Mehl` (many).

---

### Teigtemperatur (Dough Temperature)

A temperature target / range for a dough, parameterized by flour and leavening agent.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Mehl` | Reference → `Mehl` | The flour this temperature applies to. |
| `Triebmittel` | Short text | Leavening agent (e.g. "Hefe", "Sauerteig"). |
| `min Temperatur` | Integer | Minimum target dough temperature. |
| `max Temperatur` | Integer | Maximum target dough temperature. |

---

### Schritt (Step)

A single instruction within a stage.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Sortierung` | Integer | Sort order within the stage. |
| `Beschreibung` | Long text | Instruction text. |
| `Dauer` | Reference → `Dauer` | Duration of the step. |

**Inverse relations *(inferred)*:**
- Used by `Stufe.Schritte` (many).

---

### Garprozess (Proofing Process)

A fermentation/proofing process. Used both for bulk fermentation (Stockgare) and final proof (Stückgare).

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Sortierung` | Integer | Sort order. |
| `Dauer` | Reference → `Dauer` | Duration of the process. |
| `Ort` | Short text | Location/condition (e.g. "Raumtemperatur", "Kühlschrank"). |

**Inverse relations *(inferred)*:**
- Used by `Stufe.Stockgare` (many) and `Stufe.Stückgare` (many).

---

### Backvorgang (Baking Phase)

A single baking phase (recipes can have multiple, e.g. with steam, then without).

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Sortierung` | Integer | Sort order within the recipe. |
| `Grad` | Integer | Oven temperature in °C. |
| `Ofeneinstellung` | Short text | Oven setting (e.g. "Ober-/Unterhitze", "Umluft"). |
| `Dampf` | Boolean | Whether steam is used. |
| `Gusseisentopf` | Boolean | Whether a cast-iron pot is used. |
| `Dauer` | Reference → `Dauer` | Duration of this baking phase. |

**Inverse relations *(inferred)*:**
- Used by `Rezept.Backvorgänge` (many).

---

### Dauer (Duration)

A reusable duration range with min/max bounds.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Min Stunden` | Integer | Minimum hours. |
| `Min Minuten` | Integer | Minimum minutes. |
| `Max Stunden` | Integer | Maximum hours. |
| `Max Minuten` | Integer | Maximum minutes. |

**Inverse relations *(inferred)*:**
- Referenced by `Schritt.Dauer`, `Garprozess.Dauer`, `Backvorgang.Dauer`.

---

### Menge (Quantity / Yield)

Yield information for a recipe.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Beschreibung` | Short text | Description (e.g. "Brote", "Brötchen"). |
| `Anzahl` | Integer | Count produced. |

**Inverse relations *(inferred)*:**
- Referenced by `Rezept.Menge`.

---

### Ursprung (Origin)

The source of a recipe.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Typ` | Short text | Origin type (e.g. "Buch", "Website", "Video"). |
| `Name` | Short text | Source name (author, site, channel). |
| `Url` | Short text | URL, if applicable. |
| `Buchseite` | Integer | Page number, if from a book. |
| `Video Link` | Short text | Video URL, if applicable. |

**Inverse relations *(inferred)*:**
- Referenced by `Rezept.Ursprung`.

---

### Bewertung (Rating / Review)

An individual rating/review entry on a recipe.

| Field | Type | Notes |
|---|---|---|
| `id` *(inferred)* | Integer / UUID | Primary key. |
| `Datum` | Date & time | When the rating was given. |
| `Notizen` | Rich text | Free-form notes. |

**Inverse relations *(inferred)*:**
- Referenced by `Rezept.Bewertungen` (many).

---

## Relationship Summary

All relationships drawn in the ERD, in one place.

| From | Field | Cardinality | To |
|---|---|---|---|
| `Rezept` | `Vostufen` | many | `Stufe` |
| `Rezept` | `Hauptteig` | one | `Stufe` |
| `Rezept` | `Backvorgänge` | many | `Backvorgang` |
| `Rezept` | `Menge` | one | `Menge` |
| `Rezept` | `Ursprung` | one | `Ursprung` |
| `Rezept` | `Original` | one (self) | `Rezept` |
| `Rezept` | `Bewertungen` | many | `Bewertung` |
| `Stufe` | `Zutaten` | many | `Zutat` |
| `Stufe` | `Schritte` | many | `Schritt` |
| `Stufe` | `Stockgare` | many | `Garprozess` |
| `Stufe` | `Stückgare` | many | `Garprozess` |
| `Zutat` | `Mehl` | one | `Mehl` |
| `Zutat` | `Alternative` | one (self) | `Zutat` |
| `Teigtemperatur` | `Mehl` | one | `Mehl` |
| `Schritt` | `Dauer` | one | `Dauer` |
| `Garprozess` | `Dauer` | one | `Dauer` |
| `Backvorgang` | `Dauer` | one | `Dauer` |

---

## Conceptual Hierarchy

A high-level view of how the entities nest in practice:

```
Rezept
├── Vostufen: [Stufe, Stufe, …]      # pre-stages (preferments etc.)
│   └── (each Stufe)
│       ├── Zutaten:   [Zutat, …]    # → Mehl, → Zutat (Alternative)
│       ├── Schritte:  [Schritt, …]  # → Dauer
│       ├── Stockgare: [Garprozess]  # → Dauer
│       └── Stückgare: [Garprozess]  # → Dauer
├── Hauptteig: Stufe                 # main dough (same shape as above)
├── Backvorgänge: [Backvorgang, …]   # → Dauer
├── Menge:        Menge
├── Ursprung:     Ursprung
├── Original:     Rezept?            # optional self-reference
└── Bewertungen:  [Bewertung, …]

Independent reference table:
Teigtemperatur → Mehl                # not directly attached to Rezept,
                                     # used as a lookup by Mehl + Triebmittel
```

---

## Notes & Open Questions

These were not derivable from the ERD alone and may need confirmation when implementing:

1. **`Rezept.Bewertung` (Integer) vs `Rezept.Bewertungen` (many → Bewertung)** — the ERD has both. The integer is likely a cached aggregate (e.g. average rating); the references are the individual reviews. To be confirmed.
2. **`Bewertung` has no rating value field** in the ERD (only `Datum` and `Notizen`). A score field may be missing or stored elsewhere.
3. **`Teigtemperatur`** is not connected to `Rezept` or `Stufe`. It appears to function as a standalone lookup table keyed by `(Mehl, Triebmittel)`.
4. **`Schütttemperatur`** lives on `Zutat` rather than on `Stufe`, even though it's typically a per-dough value. Worth verifying whether this is intentional.
5. **Units**: `Grad` (°C), `Min/Max Temperatur` (°C assumed), `Menge In Gramm` (grams) — consistent with European baking conventions, but not explicitly specified in the ERD.
