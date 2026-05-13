// Breadly Scheduler — the centerpiece.
// Phase bars w/ live countdown tick + ready ripple + bottom drawer.
const { useState, useEffect, useRef } = React;

const PHASES = [
  { id: "pre",   label: "Pre-ferment",   minutes: 12 * 60, kind: "warm",  steps: ["Mix 50 g starter, 100 g flour, 100 g water.", "Cover loosely, leave at room temp."] },
  { id: "bulk",  label: "Bulk ferment",  minutes: 4 * 60,  kind: "warm",  steps: ["Mix flour, water, levain, salt.", "Stretch & fold every 30 min × 4."] },
  { id: "shape", label: "Shape",         minutes: 20,      kind: "warm",  steps: ["Pre-shape, bench rest 20 min.", "Final shape into banneton."] },
  { id: "cold",  label: "Cold retard",   minutes: 12 * 60, kind: "cold",  steps: ["Cover, refrigerate 8 – 14 h."] },
  { id: "bake",  label: "Bake",          minutes: 50,      kind: "warm",  steps: ["Preheat oven 250 °C.", "Score, bake covered 25 min, then 25 min uncovered."] },
];

function fmt(mins) {
  if (mins <= 0) return "now";
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  if (h === 0) return `${m} m`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} m`;
}
function fmtSec(seconds) {
  if (seconds <= 0) return "now";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${h} h ${pad(m)} m ${pad(s)} s`;
}

function PhaseBar({ phase, state, fillPct, secondsLeft, onTap, isReady }) {
  // state: 'idle' | 'running' | 'done'
  const isWarm = phase.kind === "warm";
  const isCold = phase.kind === "cold";
  const tickRef = useRef(null);
  const [tickOn, setTickOn] = useState(false);

  useEffect(() => {
    if (state !== "running") return;
    const id = setInterval(() => {
      setTickOn(true);
      setTimeout(() => setTickOn(false), 80);
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  const baseClass = isWarm ? "ad-phasebar is-warm" : isCold ? "ad-phasebar is-cold" : "ad-phasebar";

  // Token-driven palette: idle uses warm/cold idle tokens; running shows
  // an idle background with a colored progress fill on top; done = full fill.
  const surfaceBg =
    state === "done"  ? (isCold ? "var(--phase-cold-fill)" : "var(--phase-warm-fill)")
    : state === "running" ? (isCold ? "var(--phase-cold)" : isWarm ? "var(--phase-warm)" : "var(--phase-rest)")
    : "var(--phase-rest)";

  const surfaceColor =
    state === "done" ? "var(--warm-50)"
    : state === "running" && isCold ? "var(--slate-700)"
    : state === "running" && isWarm ? "var(--amber-900)"
    : "var(--fg-muted)";

  return (
    <button onClick={onTap} className={baseClass} style={{
      width: "100%", border: "1px solid transparent", padding: 0,
      cursor: "pointer", overflow: "hidden",
      background: surfaceBg,
      color: surfaceColor,
      position: "relative", height: 40, borderRadius: 6,
    }}>
      {state === "running" ? (
        <div className="ad-phasebar-fill"
             style={{ background: isCold ? "var(--phase-cold-fill)" : "var(--phase-warm-fill)", width: `${fillPct}%`, opacity: 0.9 }} />
      ) : null}
      <div className="ad-phasebar-content" style={{ padding: "0 14px" }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>
          {state === "done" && phase.id === "bake" ? "Ready" : phase.label}
        </span>
        <span ref={tickRef}
              className="ad-phasebar-tick"
              style={{
                fontSize: 13,
                transform: tickOn ? "scale(1.02)" : "scale(1)",
                transition: "transform 80ms ease-out",
              }}>
          {state === "running"
            ? fmtSec(secondsLeft) + " left"
            : state === "done"
              ? "now"
              : fmt(phase.minutes)}
        </span>
      </div>
      {isReady ? <ReadyRipple /> : null}
    </button>
  );
}

function ReadyRipple() {
  return (
    <span style={{
      position: "absolute", right: 8, top: "50%", width: 12, height: 12,
      transform: "translate(0, -50%)", pointerEvents: "none",
    }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: 99,
        background: "var(--accent)",
        animation: "breadly-ripple 600ms var(--ease-out-soft)",
      }} />
      <style>{`
        @keyframes breadly-ripple {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(8); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

function PhaseDrawer({ phase, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "var(--bg-overlay)",
        opacity: phase ? 1 : 0, pointerEvents: phase ? "auto" : "none",
        transition: "opacity var(--dur-base) var(--ease-standard)", zIndex: 60,
      }} />
      <div className={`ad-drawer${phase ? " is-open" : ""}`} style={{ zIndex: 61, padding: "20px 24px 32px" }}>
        <div style={{
          width: 36, height: 4, background: "var(--border-strong)", borderRadius: 99,
          margin: "0 auto 16px",
        }} />
        {phase ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 className="ad-h2">{phase.label}</h2>
              <span className="ad-caption">{fmt(phase.minutes)}</span>
            </div>
            <p className="ad-p" style={{ color: "var(--fg-muted)", marginBottom: 16 }}>
              Step-by-step instructions for this phase.
            </p>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {phase.steps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 99, flexShrink: 0,
                    background: "var(--accent-soft)", color: "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 500,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.5 }}>{s}</span>
                </li>
              ))}
            </ol>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <button className="ad-btn ad-btn-accent" onClick={onClose}>
                <Icon name="check" size={16} /> Mark done
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function Scheduler({ recipe, onBack }) {
  // Demo state — phase 1 (bulk) is running at 55%.
  const [running, setRunning] = useState({ phaseIdx: 1, fillPct: 55, secondsLeft: 2 * 3600 + 14 * 60 + 3 });
  const [openPhase, setOpenPhase] = useState(null);
  const [readyId, setReadyId] = useState(null);

  // tick the running phase
  useEffect(() => {
    const id = setInterval(() => {
      setRunning(prev => prev ? { ...prev, secondsLeft: Math.max(0, prev.secondsLeft - 1) } : prev);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function handleAdvance() {
    // Demo: triggers the "ready" ripple on bake.
    setReadyId("bake");
    setRunning(null);
    setTimeout(() => setReadyId(null), 800);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 120px" }}>
      <button className="ad-btn ad-btn-quiet ad-btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <Icon name="chevron-left" size={14} /> All recipes
      </button>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 className="ad-h1">{recipe?.name || "Country sourdough"}</h1>
        <span className="ad-eyebrow">live bake</span>
      </div>
      <p className="ad-p" style={{ color: "var(--fg-muted)", marginBottom: 24 }}>
        Ready by <span style={{ color: "var(--fg)", fontWeight: 500 }}>Saturday, 6:30 AM</span> — Breadly counts back through every phase.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {PHASES.map((p, i) => {
          const state = running == null
            ? (i < PHASES.length - 1 ? "done" : "done")
            : i < running.phaseIdx ? "done"
            : i === running.phaseIdx ? "running"
            : "idle";
          return (
            <PhaseBar key={p.id}
                      phase={p}
                      state={state}
                      fillPct={state === "running" ? running.fillPct : (state === "done" ? 100 : 0)}
                      secondsLeft={state === "running" ? running.secondsLeft : 0}
                      isReady={readyId === p.id}
                      onTap={() => setOpenPhase(p)} />
          );
        })}
      </div>

      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            {running ? `Bulk ferment · ${fmtSec(running.secondsLeft)} left` : "Bake complete"}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>
            Tap any phase for step-by-step instructions.
          </div>
        </div>
        <button className="ad-btn ad-btn-accent" onClick={handleAdvance}>
          <Icon name="play" size={16} /> {running ? "Skip to ready" : "Restart"}
        </button>
      </Card>

      <PhaseDrawer phase={openPhase} onClose={() => setOpenPhase(null)} />
    </div>
  );
}

Object.assign(window, { Scheduler, PhaseBar, PhaseDrawer, PHASES, fmt, fmtSec });
