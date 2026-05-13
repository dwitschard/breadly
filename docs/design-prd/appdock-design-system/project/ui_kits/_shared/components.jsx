// AppDock shared shell — DockBar, AppFrame, primitives
// Globals: window.React, window.ReactDOM, lucide

const { useState, useEffect, useRef, useCallback } = React;

// ---------- Icon helper ----------
function Icon({ name, size = 20, strokeWidth = 1.5, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = "";
      const i = document.createElement("i");
      i.setAttribute("data-lucide", name);
      ref.current.appendChild(i);
      window.lucide.createIcons({ attrs: { width: size, height: size, "stroke-width": strokeWidth } });
    }
  }, [name, size, strokeWidth]);
  return <span ref={ref} style={{ display: "inline-flex", lineHeight: 0 }} {...rest} />;
}

// ---------- Button ----------
function Button({ variant = "primary", size = "md", children, onClick, icon, type = "button", ...rest }) {
  const cls = `ad-btn ad-btn-${variant}${size === "sm" ? " ad-btn-sm" : size === "lg" ? " ad-btn-lg" : ""}`;
  return (
    <button type={type} className={cls} onClick={onClick} {...rest}>
      {icon ? <Icon name={icon} size={size === "sm" ? 14 : 16} /> : null}
      {children}
    </button>
  );
}

// ---------- Field / Input ----------
function Field({ label, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label ? <span className="ad-label">{label}</span> : null}
      {children}
      {hint ? <span className="ad-caption">{hint}</span> : null}
    </label>
  );
}
function Input(props) { return <input className="ad-input" {...props} />; }

// ---------- Pill ----------
function Pill({ children, variant = "amber" }) {
  return <span className={`ad-pill${variant === "neutral" ? " ad-pill-neutral" : ""}`}>{children}</span>;
}

// ---------- Card ----------
function Card({ children, style, ...rest }) {
  return <div className="ad-card" style={style} {...rest}>{children}</div>;
}

// ---------- AppDock mark ----------
function AppDockMark({ size = 28, color = "var(--accent-press)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ color }}>
      <rect x="6" y="18" width="52" height="32" rx="10" stroke="currentColor" strokeWidth="3" fill="none"/>
      <rect x="14" y="28" width="10" height="14" rx="3" fill="currentColor"/>
      <rect x="27" y="28" width="10" height="14" rx="3" fill="currentColor" opacity="0.6"/>
      <rect x="40" y="28" width="10" height="14" rx="3" fill="currentColor" opacity="0.3"/>
    </svg>
  );
}

// ---------- Breadly loaf ----------
function BreadlyLoaf({ size = 28, color = "var(--breadly-accent)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ color }}>
      <path d="M8 44 C8 26 18 18 32 18 C46 18 56 26 56 44 L56 47 C56 49 54 51 52 51 L12 51 C10 51 8 49 8 47 Z"
            stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      <path d="M20 33 L26 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 36 L34 31" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M36 39 L42 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 18 L32 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M32 13 C32 13 28 11 26 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none"/>
      <path d="M32 13 C32 13 36 11 38 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ---------- DockBar ----------
const APPS = [
  { id: "breadly",  label: "Breadly",  icon: "cookie" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "notes",    label: "Notes",    icon: "notebook-pen" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function DockBar({ activeId, onSelect }) {
  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 8, padding: 8,
      background: "var(--bg-elevated)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-pill)", zIndex: 50,
    }}>
      {APPS.map(app => (
        <button key={app.id}
                className={`ad-dock-icon${activeId === app.id ? " is-active" : ""}`}
                title={app.label}
                onClick={() => onSelect && onSelect(app.id)}>
          <Icon name={app.icon} size={22} />
        </button>
      ))}
      <div className="ad-dock-placeholder" title="More apps coming soon">
        <Icon name="plus" size={18} />
      </div>
    </div>
  );
}

// ---------- TopBar ----------
function TopBar({ title, right, brand }) {
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 56, padding: "0 24px", borderBottom: "1px solid var(--border)",
      background: "var(--bg)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {brand}
        {title ? <span style={{ fontSize: 16, fontWeight: 500, color: "var(--fg)" }}>{title}</span> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>
    </header>
  );
}

// expose
Object.assign(window, {
  Icon, Button, Field, Input, Pill, Card,
  AppDockMark, BreadlyLoaf, DockBar, TopBar, APPS,
});
