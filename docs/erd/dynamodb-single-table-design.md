# PRD: DynamoDB Single-Table Design for Breadly

## Problem Statement

Breadly's data model is currently split across two storage backends: MongoDB for recipes (a minimal `{name}` document) and DynamoDB for reminders and user settings. The ERD describes a rich, deeply nested data model (12 entities, 17 relationships) that has not yet been implemented. As the application grows to support the full recipe model — stages, ingredients, steps, proofing processes, baking phases, ratings, origins, and reference data — a unified storage strategy is needed.

The current MongoDB setup has no pagination, no filtering, no sorting, no user scoping for recipes, and no relationships between entities. Migrating to a single DynamoDB table that supports all access patterns will simplify infrastructure, reduce operational overhead, and align with AWS best practices for NoSQL design.

## Solution

Design a single-table DynamoDB schema that stores all Breadly data — recipes, stages, ratings, flour catalogue, dough temperature lookup, origin catalogues, user settings, and reminders. The design follows DynamoDB best practices: single-table design, adjacency list pattern, GSI overloading, pre-computed denormalization, and sparse indexes.

### Core Design Principles

1. **Single table** — all entity types in one DynamoDB table
2. **Item collections** — a recipe and its sub-entities (Stufen, Bewertungen) share a partition key for efficient single-query reads
3. **Scope-based GSIs** — recipe list queries use a `Scope` attribute (`GLOBAL` or `USER#{userId}`) as GSI partition key
4. **Pre-computed aggregates** — derived fields (Bewertung average, TA, Durchschnittlicher Mehltyp, Gesamtdauer) are computed at write time and stored on the Rezept item
5. **Client-side reference resolution** — Mehl and Teigtemperatur catalogues are loaded by the frontend and resolved locally
6. **Denormalized Ursprung** — origin data is copied onto the recipe item to avoid extra lookups
7. **Non-compound sort keys** — SK values use a type prefix + single UUID (e.g., `STUFE#{uuid}`), never compound business-field keys

### Dual-Scope Model

- **Global recipes**: read-only seed data, visible to all authenticated users. Loaded via migration/seed script, never created/modified through the app.
- **User recipes**: private to the owning user. Full CRUD. Created from scratch or forked from a global recipe.

### Data Volumes (Expected)

| Metric | Estimate |
|--------|----------|
| Global seed recipes | ~500 |
| Private recipes per user | ~50 |
| Total users | 5–10 (design for scaling) |
| Bewertungen per recipe | 5–10 (design for scaling) |

---

## User Stories

1. As an authenticated user, I want to see a merged list of global and my private recipes, so that I can browse all available recipes in one view.
2. As a user, I want the recipe list to clearly indicate which recipes are global and which are my own, so that I know the origin of each recipe.
3. As a user, I want to filter the recipe list to show only my recipes, only global recipes, or both, so that I can focus on the recipes I care about.
4. As a user, I want the recipe list to be sorted by creation date (newest first) by default, so that I see the most recent recipes first.
5. As a user, I want to sort the recipe list by Bewertung (rating), so that I can find the highest-rated recipes.
6. As a user, I want unrated recipes to not appear when sorting by Bewertung, so that the sorted list only shows meaningfully rated recipes.
7. As a user, I want to filter recipes by Mehl (flour type) used, so that I can find recipes using a specific flour.
8. As a user, I want to filter recipes by a minimum Bewertung threshold (e.g., >= 4 stars), so that I only see well-rated recipes.
9. As a user, I want to search recipes by Titel (text search), so that I can find a recipe by name.
10. As a user, I want to filter recipes by Durchschnittlicher Mehltyp range (e.g., 500–1000), so that I can find recipes matching a flour type range.
11. As a user, I want to filter recipes by total duration, so that I can find recipes that fit within a time constraint (e.g., "finished by tomorrow 6pm").
12. As a user, I want the recipe list to be paginated with cursor-based pagination, so that the app loads efficiently even with many recipes.
13. As a user, I want the recipe list to show Titel, Bild, Bewertung, scope indicator, Menge, Erstelldatum, total time, Teigausbeute (TA), and Durchschnittlicher Mehltyp per recipe card, so that I have enough info to choose a recipe.
14. As a user, I want to view a single recipe with all its nested data in one response (Stufen, Zutaten, Schritte, Garprozesse, Backvorgänge, Menge, Ursprung, Bewertungen), so that the full recipe is available without multiple API calls.
15. As a user, I want the recipe detail view to show other recipes that forked from the current recipe (global recipes and my own forks), so that I can discover related variants.
16. As a user, I want to create a new private recipe from scratch with the full recipe tree, so that I can add my own recipes.
17. As a user, I want to fork a global recipe into my private collection, so that I can create a personal variant while keeping a reference to the original.
18. As a user, I want to update my private recipe by full-replacing the entire recipe tree, so that all changes are saved atomically.
19. As a user, I want to delete my private recipe and have all associated data (Stufen, Bewertungen) cascade-deleted, so that no orphan data remains.
20. As a user, I want to rate any recipe (global or my own) with a score and notes, so that I can track my baking results.
21. As a user, I want to be limited to one rating per recipe, so that ratings are meaningful.
22. As a user, I want to update or delete my own rating, so that I can correct or remove it.
23. As a user, I want ratings to be public, so that all users see all ratings on a recipe.
24. As a user, I want the aggregate Bewertung on a recipe to be automatically recalculated when any rating is added, updated, or deleted, so that the list view stays accurate.
25. As a user, I want to browse the Mehl (flour) catalogue, so that I can pick flour types when creating ingredients.
26. As a user, I want to get a specific Mehl by ID, so that the UI can resolve flour references client-side.
27. As a user, I want to browse the Teigtemperatur (dough temperature) lookup table, so that the UI can show recommended temperatures based on Mehl + Triebmittel.
28. As a user, I want to manage my own Ursprung (origin) catalogue — create, read, update, and delete sources, so that I can track where my recipes come from.
29. As a user, I want deletion of an Ursprung to be prevented if it is still referenced by any recipe, so that I don't lose origin information.
30. As a user, I want to see all recipes from a given Ursprung, so that I can browse recipes by source (e.g., all recipes from a specific book).
31. As a user, I want forked recipes to keep the reference to the global Ursprung, so that the origin is preserved.
32. As a user, I want my recipes' denormalized Ursprung data to be updated when I edit an Ursprung catalogue entry, so that recipe details stay consistent.
33. As a user, I want to view global Ursprünge (seed data sources), so that I can see where global recipes come from.
34. As a user, I want the Teigtemperatur lookup to happen automatically client-side when viewing a recipe, based on the Stufe's Mehl and Triebmittel, so that I see recommended dough temperatures without extra interaction.
35. As a user, I want computed fields (Teigausbeute, Durchschnittlicher Mehltyp, GesamtdauerMin, GesamtdauerMax) to be pre-computed when I save a recipe, so that the recipe list loads efficiently.
36. As a system operator, I want global recipes, Mehl, Teigtemperatur, and global Ursprünge to be loadable as seed data, so that the application ships with reference content.
37. As a system operator, I want reminders and user settings to be migrated into the single table, so that all data lives in one DynamoDB table.
38. As a system operator, I want stale `Original` references to be cleaned up when a global recipe is removed from seed data, so that user recipes don't reference non-existent recipes.

---

## Implementation Decisions

### Single-Table Key Design

**Table Primary Key:**
- **PK** (Partition Key): String
- **SK** (Sort Key): String

**Sort Key Convention:**
- All sort keys use the format `TYPE#{uuid}` — a type prefix and a single auto-generated UUID.
- Sort keys are never compound (no multi-field assembly like `TYPE#field1#field2`).
- UUIDs are generated by the application at write time (DynamoDB does not auto-generate keys).
- Ordering within a type is handled by explicit `Sortierung` attributes, not by the SK.

### Item Type Table

| Item Type | PK | SK | Attributes |
|-----------|----|----|------------|
| **Rezept** | `REZEPT#{rezeptId}` | `REZEPT#{rezeptId}` | Titel, Description, Bild (S3 key), Scope, Erstelldatum, Bewertung (aggregate, nullable), Original (rezeptId, nullable), UrsprungId, UrsprungTyp, UrsprungName, UrsprungUrl, UrsprungBuchseite, UrsprungVideoLink, MengeBeschreibung, MengeAnzahl, Backvorgänge (list of maps, each with Sortierung, Grad, Ofeneinstellung, Dampf, Gusseisentopf, Dauer: {MinStunden, MinMinuten, MaxStunden, MaxMinuten}), MehlIds (list), Teigausbeute, DurchschnittlicherMehltyp, GesamtdauerMin, GesamtdauerMax |
| **Stufe** | `REZEPT#{rezeptId}` | `STUFE#{stufeId}` | Name, Typ, Sortierung, Triebmittel, IstHauptteig (boolean), Zutaten (list of maps: Name, Typ, MengeInGramm, MehlId, Schütttemperatur, Alternative: {Name, Typ, MengeInGramm, MehlId, Schütttemperatur}), Schritte (list of maps: Sortierung, Beschreibung, Dauer: {MinStunden, MinMinuten, MaxStunden, MaxMinuten}), Stockgare (list of maps: Sortierung, Ort, Dauer: {...}), Stückgare (list of maps: Sortierung, Ort, Dauer: {...}) |
| **Bewertung** | `REZEPT#{rezeptId}` | `BEWERTUNG#{userId}` | Wertung (1–5), Datum (ISO 8601), Notizen |
| **Mehl** | `GLOBAL` | `MEHL#{mehlId}` | Sorte, Typ, CHBeschreibung |
| **Teigtemperatur** | `GLOBAL` | `TEIGTEMPERATUR#{ttId}` | MehlId, Triebmittel, MinTemperatur, MaxTemperatur |
| **Ursprung (global)** | `GLOBAL` | `URSPRUNG#{ursprungId}` | Typ, Name, Url, Buchseite, VideoLink |
| **Ursprung (user)** | `USER#{userId}` | `URSPRUNG#{ursprungId}` | Typ, Name, Url, Buchseite, VideoLink |
| **User Settings** | `USER#{userId}` | `SETTINGS` | Language, Theme, Email |
| **Reminder** | `USER#{userId}` | `REMINDER#{scheduleId}` | RecipeId, RecipeName, ScheduledAt, Status, Message, TTL |

### Global Secondary Indexes

| GSI | PK Attribute | SK Attribute | Projected Attributes | Purpose |
|-----|-------------|-------------|---------------------|---------|
| **GSI1** | `Scope` (`GLOBAL` / `USER#{userId}`) | `Erstelldatum` (ISO 8601 string) | ALL (or selected list view fields) | Recipe list sorted by creation date (default sort) |
| **GSI2** | `Scope` | `Bewertung` (Number, sparse — absent for unrated recipes) | ALL (or selected list view fields) | Recipe list sorted by rating; only rated recipes appear |
| **GSI3** | `Scope` | `DurchschnittlicherMehltyp` (Number) | ALL (or selected list view fields) | Range filter/sort on average flour type |
| **GSI4** | `Scope` | `GesamtdauerMax` (Number, in minutes) | ALL (or selected list view fields) | Range filter on total duration (e.g., "finished by X") |

**GSI notes:**
- All four GSIs share the same PK attribute (`Scope`), with different SK attributes.
- The `Scope` attribute is only set on Rezept metadata items, making these GSIs sparse for all other item types.
- GSI2 is additionally sparse: unrated recipes (null Bewertung) are excluded.
- GSI projections should include at minimum: Titel, Bild, Bewertung, Scope, MengeBeschreibung, MengeAnzahl, Erstelldatum, GesamtdauerMin, GesamtdauerMax, Teigausbeute, DurchschnittlicherMehltyp, MehlIds, UrsprungId, UrsprungName, Original.

### Access Patterns — Full Catalogue

#### Recipe Access Patterns

| # | Access Pattern | Operation | Key/Index | Condition |
|---|---------------|-----------|-----------|-----------|
| 1 | Get full recipe (metadata + Stufen + Bewertungen) | Query | PK = `REZEPT#{rezeptId}` | Returns all items in the partition |
| 2 | List global recipes by Erstelldatum | Query | GSI1: PK = `GLOBAL` | ScanIndexForward = false for newest first |
| 3 | List user's recipes by Erstelldatum | Query | GSI1: PK = `USER#{userId}` | ScanIndexForward = false |
| 4 | List rated global recipes by Bewertung | Query | GSI2: PK = `GLOBAL` | ScanIndexForward = false for highest first |
| 5 | List rated user recipes by Bewertung | Query | GSI2: PK = `USER#{userId}` | ScanIndexForward = false |
| 6 | Filter by DurchschnittlicherMehltyp range | Query | GSI3: PK = `Scope`, SK between X and Y | Range key condition |
| 7 | Filter by GesamtdauerMax | Query | GSI4: PK = `Scope`, SK <= X | Range key condition |
| 8 | Create recipe | TransactWrite | PutItem: Rezept (PK=SK) + PutItem per Stufe | Full recipe tree written atomically |
| 9 | Update recipe (full replace) | TransactWrite | Delete old Stufen + PutItem: Rezept + PutItem per Stufe | Full replace of metadata and all Stufen |
| 10 | Delete recipe (cascade) | BatchWrite / TransactWrite | Delete all items with PK = `REZEPT#{rezeptId}` | Includes Bewertungen |
| 11 | Fork global recipe | TransactWrite | PutItem: new Rezept (Scope = `USER#{userId}`, Original = source ID) + PutItem per Stufe | Copy of the recipe tree into user scope |

#### Application-Side Operations (no GSI needed)

| # | Access Pattern | Implementation |
|---|---------------|----------------|
| 12 | Text search on Titel | Load recipe list via GSI1, filter in application by `contains(Titel, searchTerm)` |
| 13 | Filter by Mehl (flour type) | Load recipe list, filter by `MehlIds contains mehlId` |
| 14 | Filter by Bewertung threshold | Load recipe list, filter by `Bewertung >= threshold` (or use GSI2 range query) |
| 15 | Reverse references (forks of a recipe) | Load recipe list, filter by `Original = rezeptId` |
| 16 | Recipes by Ursprung | Load recipe list, filter by `UrsprungId = ursprungId` |

#### Bewertung Access Patterns

| # | Access Pattern | Operation | Key/Index |
|---|---------------|-----------|-----------|
| 17 | List Bewertungen for a recipe | Query | PK = `REZEPT#{rezeptId}`, SK begins_with `BEWERTUNG#` |
| 18 | Get user's Bewertung on a recipe | GetItem | PK = `REZEPT#{rezeptId}`, SK = `BEWERTUNG#{userId}` |
| 19 | Create Bewertung | PutItem (condition: attribute_not_exists) | PK = `REZEPT#{rezeptId}`, SK = `BEWERTUNG#{userId}` + UpdateItem on Rezept aggregate |
| 20 | Update Bewertung | PutItem | PK = `REZEPT#{rezeptId}`, SK = `BEWERTUNG#{userId}` + UpdateItem on Rezept aggregate |
| 21 | Delete Bewertung | DeleteItem | PK = `REZEPT#{rezeptId}`, SK = `BEWERTUNG#{userId}` + UpdateItem on Rezept aggregate |

#### Reference Data Access Patterns

| # | Access Pattern | Operation | Key/Index |
|---|---------------|-----------|-----------|
| 22 | List all Mehl | Query | PK = `GLOBAL`, SK begins_with `MEHL#` |
| 23 | Get Mehl by ID | GetItem | PK = `GLOBAL`, SK = `MEHL#{mehlId}` |
| 24 | List all Teigtemperatur | Query | PK = `GLOBAL`, SK begins_with `TEIGTEMPERATUR#` |
| 25 | List global Ursprünge | Query | PK = `GLOBAL`, SK begins_with `URSPRUNG#` |
| 26 | List user's Ursprünge | Query | PK = `USER#{userId}`, SK begins_with `URSPRUNG#` |
| 27 | Get Ursprung by ID (global) | GetItem | PK = `GLOBAL`, SK = `URSPRUNG#{ursprungId}` |
| 28 | Get Ursprung by ID (user) | GetItem | PK = `USER#{userId}`, SK = `URSPRUNG#{ursprungId}` |
| 29 | Create user Ursprung | PutItem | PK = `USER#{userId}`, SK = `URSPRUNG#{uuid}` |
| 30 | Update user Ursprung | PutItem | PK = `USER#{userId}`, SK = `URSPRUNG#{ursprungId}` + propagate to recipes |
| 31 | Delete user Ursprung (with referential check) | Conditional DeleteItem | Check no recipes reference this UrsprungId before deleting |

#### User Data Access Patterns (existing, migrated)

| # | Access Pattern | Operation | Key/Index |
|---|---------------|-----------|-----------|
| 32 | Get user settings | GetItem | PK = `USER#{userId}`, SK = `SETTINGS` |
| 33 | Upsert user settings | PutItem | PK = `USER#{userId}`, SK = `SETTINGS` |
| 34 | List user's reminders | Query | PK = `USER#{userId}`, SK begins_with `REMINDER#` |
| 35 | Get reminder | GetItem | PK = `USER#{userId}`, SK = `REMINDER#{scheduleId}` |
| 36 | Create reminder | PutItem | PK = `USER#{userId}`, SK = `REMINDER#{scheduleId}` |
| 37 | Delete reminder | DeleteItem | PK = `USER#{userId}`, SK = `REMINDER#{scheduleId}` |
| 38 | Update reminder status | UpdateItem | PK = `USER#{userId}`, SK = `REMINDER#{scheduleId}` |

### Embedding vs. Separate Items Summary

| Sub-Entity | Storage Strategy | Rationale |
|------------|-----------------|-----------|
| Menge | Embedded on Rezept | 1:1, two small fields |
| Backvorgänge | Embedded on Rezept (list of maps) | Small, always read/written with recipe |
| Dauer | Embedded as nested map on parent | 1:1, four small fields |
| Zutaten | Nested within Stufe item | Always read/written with stage |
| Schritte | Nested within Stufe item | Always read/written with stage |
| Stockgare / Stückgare | Nested within Stufe item | Always read/written with stage |
| Zutat.Alternative | Inlined within the Zutat map | No stable ID for reference, full-replace model |
| Ursprung on Rezept | Denormalized copy | Avoids extra lookup; propagated on Ursprung update |
| Stufe | Separate item (same PK as Rezept) | Multiple per recipe, could grow; fetched via Query |
| Bewertung | Separate item (same PK as Rezept) | Written by different users independently |

### Recipe Bild (Image)

Images are stored in S3. The `Bild` attribute on the Rezept item holds the S3 object key (string). The application generates presigned URLs for the frontend.

### Aggregate Bewertung Recalculation

When a Bewertung is created, updated, or deleted, the application recalculates the aggregate:
1. Query all Bewertungen for the recipe: `PK = REZEPT#{rezeptId}, SK begins_with BEWERTUNG#`
2. Compute the average Wertung
3. UpdateItem on the Rezept metadata item: set `Bewertung = average` (or remove attribute if no ratings remain)

This is done in the application layer during the Bewertung mutation, not via DynamoDB Streams.

### Ursprung Update Propagation

When a user updates an Ursprung catalogue entry:
1. Update the Ursprung item itself
2. Query all user's recipes via GSI1 (PK = `USER#{userId}`)
3. Filter recipes where `UrsprungId = updatedUrsprungId`
4. BatchWrite to update denormalized Ursprung fields on matching Rezept items

### Global Recipe Deletion (Seed Data Removal)

If a global recipe is removed from seed data:
1. Delete the recipe's item collection (metadata + Stufen + Bewertungen)
2. Query all recipes (global + all users) where `Original = deletedRezeptId`
3. Remove the `Original` reference from those recipes

This is an operational/migration concern, not an in-app feature.

### ERD Modifications

The following changes to the ERD schema are required for the DynamoDB design:

1. **Bewertung: add `Wertung` field** (Integer, 1–5) — missing from the ERD, needed for the rating score
2. **Stufe: add `Triebmittel` field** (Short text) — explicit leavening agent field for Teigtemperatur lookup
3. **Stufe: add `IstHauptteig` field** (Boolean) — distinguishes Hauptteig from Vorstufe within the item collection
4. **Rezept: add `Scope` field** (String: `GLOBAL` / `USER#{userId}`) — dual-scope model identifier
5. **Rezept: add `Erstelldatum` field** (Date & time) — creation timestamp for default sort
6. **Rezept: add computed fields** — Teigausbeute, DurchschnittlicherMehltyp, GesamtdauerMin, GesamtdauerMax, MehlIds (all pre-computed at write time)

### Merged List Query Strategy

The merged recipe list (global + user's private) is assembled by the application:

1. **Two parallel GSI queries**: GSI1 PK = `GLOBAL` + GSI1 PK = `USER#{userId}` (or GSI2/3/4 depending on active sort)
2. **Application-side merge**: interleave results from both queries, maintaining sort order
3. **Cursor-based pagination**: each query uses its own `LastEvaluatedKey`; the application tracks two cursors and returns a combined `nextToken` encoding both
4. **Application-side filters**: after merging, filter by Mehl, Bewertung threshold, Titel search as needed

### Concurrency

- No optimistic locking is required
- Each user's Bewertung is a distinct item — no write conflicts between users
- Aggregate Bewertung recalculation uses UpdateExpression (atomic)
- Private recipes are owned by one user — no concurrent writes from different users

---

## Testing Decisions

Testing should verify external behavior through the API layer, not DynamoDB internals.

### What Makes a Good Test

- Tests verify the application's observable behavior (API responses, data consistency)
- Tests do not assert on DynamoDB internal state (item structure, attribute names)
- Mocking is done at the DynamoDB client level (using a local DynamoDB instance or mocked DocumentClient)
- Tests cover access patterns, not implementation details of the key schema

### Modules to Test

1. **Recipe service** — CRUD operations, full-replace semantics, cascade delete, fork operation, computed field calculation
2. **Bewertung service** — CRUD with one-per-user enforcement, aggregate recalculation
3. **Ursprung service** — CRUD with referential integrity check, update propagation to recipes
4. **Recipe list service** — merged list assembly, cursor-based pagination, sorting, filtering
5. **Mehl/Teigtemperatur services** — catalogue read operations
6. **Seed data loader** — migration script for loading global seed data

### Prior Art

- Existing reminder repository tests (`reminder.repository.spec.ts`) provide patterns for DynamoDB service testing with mocked clients
- Existing recipe controller integration tests (`recipe.controller.spec.ts`) provide patterns for supertest-based API testing

---

## Out of Scope

1. **Tags/categories on recipes** — mentioned as a future filter, not designed in this PRD
2. **Additional sort options** — beyond Erstelldatum and Bewertung; to be added as GSIs when defined
3. **Full-text search infrastructure** — OpenSearch or similar; text search is application-side for now
4. **Percentage-based flour filtering** — filtering by flour percentage threshold deferred for simplicity
5. **Admin UI for seed data management** — global data is loaded via scripts, not an admin interface
6. **Multi-region / global tables** — single-region design for now
7. **DynamoDB Streams** — not used for aggregate recalculation; done in application layer
8. **Image upload workflow** — S3 upload mechanism (presigned URLs, size limits) is a separate concern
9. **User-to-user recipe sharing** — private recipes are only visible to their owner
10. **Multiple ratings per user per recipe** — one rating per user per recipe is enforced

---

## Further Notes

### Capacity Mode

Start with **on-demand capacity** mode. With ~10 users and ~550 recipes, provisioned capacity is unnecessary overhead. Switch to provisioned with auto-scaling when usage patterns stabilize.

### DynamoDB Item Size

The 400KB DynamoDB item size limit should not be a concern:
- Rezept metadata with all embedded and denormalized fields: well under 10KB typically
- Stufe items with nested Zutaten, Schritte, and Garprozesse: well under 50KB even for complex stages
- Bewertung items: under 1KB each

### Migration Path

1. Create the single DynamoDB table with all four GSIs
2. Migrate existing reminders and user settings into the new table
3. Implement the new recipe data model
4. Load seed data (global recipes, Mehl, Teigtemperatur, global Ursprünge)
5. Retire the MongoDB collection and the old DynamoDB table(s)

### Extensibility

- **New sort options**: add a new GSI with `Scope` as PK and the new sort attribute as SK
- **New filter dimensions**: add attributes to the Rezept item; filter application-side for small datasets, add GSI for large datasets
- **Tags** (future): add a `Tags` list attribute on Rezept, filter application-side or create a GSI
- **New computed fields**: add attributes to Rezept, compute at write time during full-replace
