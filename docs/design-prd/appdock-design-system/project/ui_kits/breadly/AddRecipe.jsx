// Breadly — Add Recipe flow with hydration calculator.
const { useState, useMemo } = React;

function HydrationCalculator({ flour, water, onChange }) {
  const pct = useMemo(() => {
    const f = parseFloat(flour);
    const w = parseFloat(water);
    if (!f || f <= 0) return null;
    return Math.round((w / f) * 1000) / 10;
  }, [flour, water]);

  return (
    <div style={{
      background: "var(--bg-sunken)", border: "1px solid var(--border)",
      borderRadius: 12, padding: 16,
    }}>
      <div className="ad-eyebrow" style={{ marginBottom: 10 }}>Hydration calculator</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "end" }}>
        <Field label="Flour (g)">
          <Input type="number" value={flour} onChange={(e) => onChange("flour", e.target.value)} />
        </Field>
        <Field label="Water (g)">
          <Input type="number" value={water} onChange={(e) => onChange("water", e.target.value)} />
        </Field>
        <div>
          <span className="ad-label" style={{ display: "block", marginBottom: 6 }}>Hydration</span>
          <div style={{
            height: 40, padding: "0 12px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--accent-soft)", borderRadius: 8,
            color: "var(--accent-press)",
            fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 16,
            transition: "background var(--dur-fast) var(--ease-standard)",
          }}>
            <span>{pct == null ? "—" : pct.toFixed(1)}</span>
            <span style={{ fontSize: 13, opacity: 0.7 }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddRecipe({ onCancel, onSave }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: "Country sourdough", flour: "850", water: "638", loaves: 2 });
  function set(k, v) { setData(d => ({ ...d, [k]: v })); }

  const steps = [
    {
      title: "Name your recipe",
      sub: "Something you'll recognize on the dock.",
      body: (
        <Field label="Recipe name">
          <Input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Country sourdough" />
        </Field>
      ),
    },
    {
      title: "Flour & water",
      sub: "We'll calculate hydration as you type.",
      body: (
        <HydrationCalculator
          flour={data.flour}
          water={data.water}
          onChange={set}
        />
      ),
    },
    {
      title: "How many loaves?",
      sub: "We'll scale ingredients for you.",
      body: (
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4].map(n => (
            <button key={n} onClick={() => set("loaves", n)} style={{
              flex: 1, height: 64, borderRadius: 12, cursor: "pointer",
              background: data.loaves === n ? "var(--accent-soft)" : "var(--bg-elevated)",
              border: `1px solid ${data.loaves === n ? "var(--accent)" : "var(--border)"}`,
              color: data.loaves === n ? "var(--accent-press)" : "var(--fg)",
              fontSize: 22, fontWeight: 500,
              transition: "all var(--dur-fast) var(--ease-standard)",
            }}>
              {n}
            </button>
          ))}
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const cur = steps[step];

  return (
    <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 24px 120px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button className="ad-btn ad-btn-quiet ad-btn-sm" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          <Icon name="chevron-left" size={14} /> {step === 0 ? "Cancel" : "Back"}
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {steps.map((_, i) => (
            <span key={i} style={{
              width: 24, height: 4, borderRadius: 99,
              background: i <= step ? "var(--accent)" : "var(--border)",
              transition: "background var(--dur-base) var(--ease-standard)",
            }} />
          ))}
        </div>
      </div>

      <div key={step} style={{ animation: "breadly-step-in 180ms var(--ease-standard)" }}>
        <h1 className="ad-h1" style={{ marginBottom: 6 }}>{cur.title}</h1>
        <p className="ad-p" style={{ color: "var(--fg-muted)", marginBottom: 24 }}>{cur.sub}</p>
        {cur.body}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
        {isLast ? (
          <button className="ad-btn ad-btn-accent ad-btn-lg" onClick={() => onSave && onSave(data)}>
            <Icon name="check" size={16} /> Save recipe
          </button>
        ) : (
          <button className="ad-btn ad-btn-accent ad-btn-lg" onClick={() => setStep(s => s + 1)}>Next</button>
        )}
      </div>

      <style>{`
        @keyframes breadly-step-in {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

Object.assign(window, { AddRecipe, HydrationCalculator });
