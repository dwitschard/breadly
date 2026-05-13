// Breadly — recipe list, recipe card, empty state
const { useState } = React;

function RecipeCard({ recipe, onOpen }) {
  return (
    <button onClick={onOpen} style={{
      textAlign: "left", cursor: "pointer", padding: 0, overflow: "hidden",
      background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: 12, position: "relative",
      transition: "transform 120ms var(--ease-standard), border-color 120ms var(--ease-standard)",
      display: "flex", flexDirection: "column",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--accent)", opacity: 0.6 }} />
      <div style={{ padding: "18px 18px 18px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 17, fontWeight: 500, color: "var(--fg)" }}>{recipe.name}</div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>
          {recipe.flour} <span style={{ color: "var(--fg-subtle)" }}>·</span> {recipe.hydration}% hydration
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Pill variant="neutral">{recipe.totalTime}</Pill>
          <Pill variant="neutral">{recipe.loaves} {recipe.loaves === 1 ? "loaf" : "loaves"}</Pill>
          {recipe.scheduled ? <Pill>scheduled · {recipe.scheduled}</Pill> : null}
        </div>
      </div>
    </button>
  );
}

const SAMPLE_RECIPES = [
  { id: "country",  name: "Country sourdough",   flour: "Bread flour, 10% rye", hydration: 75, totalTime: "24 h", loaves: 2, scheduled: "Sat 6:30" },
  { id: "ciabatta", name: "Olive oil ciabatta",  flour: "00 flour",             hydration: 80, totalTime: "8 h",  loaves: 4 },
  { id: "rye",      name: "100% rye sour",       flour: "Whole rye",            hydration: 85, totalTime: "36 h", loaves: 1 },
];

function RecipeList({ onOpen, onNew, onEmpty }) {
  if (onEmpty) {
    return <EmptyState onAdd={onNew} />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="ad-h1">Your recipes</h1>
          <p className="ad-p" style={{ color: "var(--fg-muted)", marginTop: 4 }}>
            3 saved · 1 scheduled bake.
          </p>
        </div>
        <Button variant="ghost" icon="plus" onClick={onNew}>Add recipe</Button>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14,
      }}>
        {SAMPLE_RECIPES.map(r => <RecipeCard key={r.id} recipe={r} onOpen={() => onOpen(r)} />)}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  const presets = [
    { id: "country",  name: "Country sourdough",  meta: "75% hydration · 24 h",  icon: "wheat" },
    { id: "ciabatta", name: "Olive oil ciabatta", meta: "80% hydration · 8 h",   icon: "droplet" },
    { id: "rye",      name: "100% rye sour",      meta: "85% hydration · 36 h",  icon: "flame" },
  ];
  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "56px 24px 120px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <div style={{ color: "var(--breadly-accent)", opacity: 0.85 }}>
          <BreadlyLoaf size={72} color="currentColor" />
        </div>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <h2 className="ad-h2" style={{ marginBottom: 6 }}>No recipes yet.</h2>
          <p className="ad-p" style={{ color: "var(--fg-muted)" }}>Let's bake something. Start from a preset or build your own.</p>
        </div>
      </div>

      <div className="ad-eyebrow" style={{ marginBottom: 10 }}>Start from a preset</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {presets.map(p => (
          <button key={p.id} onClick={onAdd} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 10, cursor: "pointer", textAlign: "left",
            transition: "border-color 120ms var(--ease-standard), transform 120ms var(--ease-standard)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--fg-muted)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--bg-sunken)", color: "var(--fg-muted)",
            }}>
              <Icon name={p.icon} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{p.meta}</div>
            </div>
            <Icon name="chevron-right" size={16} />
          </button>
        ))}
      </div>

      <div style={{
        padding: 14, background: "var(--bg-sunken)", border: "1px dashed var(--border-strong)",
        borderRadius: 10, display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 99, background: "var(--bg-elevated)",
          color: "var(--fg-muted)", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="upload" size={16} />
        </div>
        <div style={{ flex: 1, fontSize: 13, color: "var(--fg-muted)" }}>
          Have a recipe card? <span style={{ color: "var(--fg)", fontWeight: 500 }}>Import from photo</span> or paste text.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="ad-btn ad-btn-accent ad-btn-lg" onClick={onAdd}>
          <Icon name="plus" size={16} /> Build your own
        </button>
        <Button variant="ghost" size="lg" icon="book-open" onClick={onAdd}>Browse library</Button>
      </div>
    </div>
  );
}

Object.assign(window, { RecipeList, RecipeCard, EmptyState, SAMPLE_RECIPES });
