
// ============================================================
// Breadly — Shared primitives
// All screens import from window after this script runs.
// ============================================================
const { useState, useEffect, useRef } = React;

// ── Design tokens (mirrors ds/colors_and_type.css) ──────────
const T = {
  amber50:  '#FFFBEB', amber100: '#FEF3C7', amber200: '#FDE68A',
  amber300: '#FCD34D', amber400: '#FBBF24', amber500: '#F59E0B',
  amber600: '#D97706', amber700: '#B45309', amber800: '#92400E',
  amber950: '#451A03',
  warm25:  '#FDFCFA', warm50:  '#FAF8F5', warm100: '#F4F1EC',
  warm200: '#E9E4DC', warm300: '#D6CFC4', warm400: '#A8A096',
  warm500: '#78716C', warm600: '#57534E', warm700: '#3F3B36',
  warm800: '#292524', warm900: '#1C1917',
  slate100: '#E6EAEE', slate200: '#CBD3DC', slate400: '#8896A6',
  slate600: '#4B5868', slate700: '#364151',
  green500: '#65A30D', greenBg: '#ECFCCB', greenText: '#3F6212',
  red50: '#FEF2F2', red200: '#FECACA', red500: '#DC2626', red600: '#B91C1C', red700: '#991B1B',
};

// ── Icon wrapper ─────────────────────────────────────────────
function Icon({ name, size = 16, color, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = '';
      const el = document.createElement('i');
      el.setAttribute('data-lucide', name);
      ref.current.appendChild(el);
      lucide.createIcons({ attrs: { 'stroke-width': '1.5', width: size, height: size }, nodes: [el] });
    }
  }, [name, size]);
  return <span ref={ref} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', color: color || 'currentColor', flexShrink:0, ...style }} />;
}

// ── Button ───────────────────────────────────────────────────
function Btn({ variant='primary', size='md', disabled, loading, icon, iconRight, children, onClick, style, type='button' }) {
  const h  = size === 'sm' ? 30 : size === 'lg' ? 46 : 40;
  const px = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const fs = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  const r  = size === 'sm' ? 6  : size === 'lg' ? 10 : 8;

  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    gap:8, height:h, padding:`0 ${px}px`, borderRadius:r,
    fontFamily:"'Geist', sans-serif", fontSize:fs, fontWeight:500, lineHeight:1,
    border:'1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition:'background 120ms ease, border-color 120ms ease',
    whiteSpace:'nowrap', ...style,
  };

  const variants = {
    primary:   { background: T.amber600, color: '#FBF7F1', borderColor:'transparent' },
    secondary: { background: T.warm25, color: T.warm900, borderColor: T.warm300 },
    ghost:     { background: 'transparent', color: T.warm600, borderColor:'transparent' },
    danger:    { background: T.red500, color:'#fff', borderColor:'transparent' },
    outline:   { background: 'transparent', color: T.warm700, borderColor: T.warm300 },
  };

  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={e => {
        if (disabled) return;
        const el = e.currentTarget;
        if (variant === 'primary') el.style.background = T.amber700;
        if (variant === 'secondary') el.style.background = T.warm100;
        if (variant === 'ghost') { el.style.background = T.warm100; el.style.color = T.warm900; }
        if (variant === 'outline') el.style.background = T.warm100;
      }}
      onMouseLeave={e => {
        if (disabled) return;
        const el = e.currentTarget;
        el.style.background = variants[variant].background;
        el.style.color = variants[variant].color || '';
      }}
    >
      {loading && <span style={{ width:16, height:16, border:`2px solid currentColor`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 700ms linear infinite', flexShrink:0 }} />}
      {icon && !loading && <Icon name={icon} size={16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={16} />}
    </button>
  );
}

// ── FormField ────────────────────────────────────────────────
function FormField({ label, value, onChange, placeholder, type='text', suffix, error, disabled, min, max, inputRight, style }) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? T.red500 : focused ? T.amber600 : T.warm200;
  const ring = error ? `0 0 0 3px ${T.red50}` : focused ? `0 0 0 3px ${T.amber400}44` : 'none';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...style }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color: T.warm900, lineHeight:1.3 }}>{label}</label>}
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        <input
          type={type} value={value} onChange={e => onChange && onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled} min={min} max={max}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex:1, height:40, padding:`0 ${suffix || inputRight ? '40px' : '12px'} 0 12px`,
            border:`1px solid ${borderColor}`, borderRadius:4,
            fontFamily:"'Geist', sans-serif", fontSize:14, color: T.warm900,
            background: disabled ? T.warm100 : T.warm25,
            boxShadow: ring, outline:'none',
            transition:'border-color 120ms ease, box-shadow 120ms ease',
          }}
        />
        {suffix && (
          <span style={{ position:'absolute', right:12, fontSize:13, fontWeight:500, color: T.warm500, pointerEvents:'none' }}>
            {suffix}
          </span>
        )}
        {inputRight && (
          <div style={{ position:'absolute', right:0, top:0, bottom:0, display:'flex', alignItems:'center' }}>
            {inputRight}
          </div>
        )}
      </div>
      {error && <span style={{ fontSize:12, color: T.red500, marginTop:2 }}>{error}</span>}
    </div>
  );
}

// ── SegmentedBtn ─────────────────────────────────────────────
function SegmentedBtn({ options, value, onChange }) {
  return (
    <div style={{ display:'inline-flex', border:`1px solid ${T.warm300}`, borderRadius:8, overflow:'hidden', background: T.warm25 }}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            style={{
              height:36, padding:'0 16px', background: active ? T.amber600 : 'transparent',
              border:'none', borderRight: i < options.length-1 ? `1px solid ${active ? T.amber600 : T.warm300}` : 'none',
              fontFamily:"'Geist', sans-serif", fontSize:14, fontWeight:500,
              color: active ? '#FBF7F1' : T.warm700, cursor:'pointer',
              transition:'background 120ms ease, color 120ms ease',
            }}
          >{opt.label}</button>
        );
      })}
    </div>
  );
}

// ── Select / Dropdown ────────────────────────────────────────
function Select({ value, onChange, options, width = 90 }) {
  return (
    <div style={{ position:'relative', width }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          appearance:'none', width:'100%', height:40, padding:'0 28px 0 10px',
          border:`1px solid ${T.warm300}`, borderRadius:4, fontFamily:"'Geist', sans-serif",
          fontSize:14, color: T.warm900, background: T.warm25, cursor:'pointer', outline:'none',
        }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color: T.warm500 }}>
        <Icon name="chevron-down" size={14} />
      </span>
    </div>
  );
}

// ── Tag / Status Chip ────────────────────────────────────────
function Tag({ variant='neutral', dot, children }) {
  const styles = {
    success:  { bg: T.greenBg,   color: T.greenText },
    danger:   { bg: T.red50,     color: T.red700 },
    neutral:  { bg: T.warm100,   color: T.warm700 },
    info:     { bg: T.slate100,  color: T.slate700 },
    amber:    { bg: T.amber100,  color: T.amber800 },
    admin:    { bg: '#EFF6FF',   color: '#1D4ED8' },
    user:     { bg: T.warm100,   color: T.warm700 },
    warning:  { bg: '#FEF3C7',   color: '#92400E' },
  };
  const s = styles[variant] || styles.neutral;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px',
      borderRadius:4, fontSize:12, fontWeight:500, lineHeight:1.4,
      background: s.bg, color: s.color,
    }}>
      {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', flexShrink:0 }} />}
      {children}
    </span>
  );
}

// ── BakingTimeline ───────────────────────────────────────────
function BakingTimeline({ steps }) {
  const [hovered, setHovered] = useState(null);
  const totalMins = steps.reduce((s, st) => s + st.mins, 0);

  return (
    <div style={{ width:'100%' }}>
      {/* Bar */}
      <div style={{ position:'relative', display:'flex', height:12, borderRadius:6, overflow:'hidden', gap:1 }}>
        {steps.map((st, i) => {
          const w = (st.mins / totalMins) * 100;
          const isWait = st.type === 'wait';
          return (
            <div key={i}
              title={`${st.name}: ${st.mins < 60 ? st.mins + 'min' : (st.mins/60).toFixed(1).replace('.0','') + 'h'}`}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{
                flex: `0 0 calc(${w}% - 1px)`,
                background: isWait
                  ? (hovered === i ? T.slate400 : T.slate600)
                  : (hovered === i ? T.amber500 : T.amber700),
                borderRadius: i === 0 ? '6px 0 0 6px' : i === steps.length-1 ? '0 6px 6px 0' : 0,
                transition:'background 150ms ease',
                cursor:'default',
                // Hatched texture for wait steps
                backgroundImage: isWait
                  ? `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)`
                  : 'none',
              }}
            />
          );
        })}
      </div>
      {/* Labels */}
      <div style={{ position:'relative', display:'flex', marginTop:6 }}>
        {steps.map((st, i) => {
          const w = (st.mins / totalMins) * 100;
          const dur = st.mins < 60 ? `${st.mins}min` : `${Math.floor(st.mins/60)}h${st.mins%60 ? ' '+st.mins%60+'min' : ''}`;
          return (
            <div key={i} style={{
              flex:`0 0 ${w}%`, overflow:'hidden',
              display:'flex', flexDirection:'column', gap:1,
            }}>
              <span style={{ fontFamily:"'Geist Mono', monospace", fontSize:10, color: T.warm500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{st.name}</span>
              <span style={{ fontFamily:"'Geist Mono', monospace", fontSize:9, color: T.warm400 }}>{dur}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EnvironmentBadge ─────────────────────────────────────────
function EnvironmentBadge({ env }) {
  const map = {
    Lokal:   { bg: T.greenBg,   color: T.greenText },
    Dev:     { bg: T.amber100,  color: T.amber800 },
    Staging: { bg: '#EFF6FF',   color: '#1D4ED8' },
  };
  const s = map[env] || map.Lokal;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', height:22, padding:'0 8px',
      borderRadius:99, fontSize:11, fontWeight:500,
      background: s.bg, color: s.color,
    }}>{env}</span>
  );
}

// ── SkeletonRow ──────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 16px', background: T.warm25, borderBottom:`1px solid ${T.warm100}`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:16, height:16, borderRadius:4, background: T.warm200 }} />
        <div style={{ width:180, height:13, borderRadius:4, background: T.warm200, animation:'pulse 1.4s ease-in-out infinite' }} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:48, height:20, borderRadius:4, background: T.warm200, animation:'pulse 1.4s ease-in-out infinite 0.2s' }} />
        <div style={{ width:64, height:13, borderRadius:4, background: T.warm200, animation:'pulse 1.4s ease-in-out infinite 0.1s' }} />
      </div>
    </div>
  );
}

// ── ErrorBanner ──────────────────────────────────────────────
function ErrorBanner({ message, onRetry, onDismiss }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'10px 14px', borderRadius:8,
      border:`1px solid ${T.red200}`, background: T.red50, marginBottom:16,
    }}>
      <Icon name="alert-circle" size={16} color={T.red500} style={{ flexShrink:0 }} />
      <span style={{ flex:1, fontSize:14, color: T.red700 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ fontSize:14, fontWeight:500, color: T.red700, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
          Erneut versuchen
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} style={{ background:'none', border:'none', cursor:'pointer', color: T.red500, padding:0, display:'flex', alignItems:'center' }}>
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────
function Navbar({ active, env = 'Lokal', isAdmin = true, mobile = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (mobile) {
    return (
      <nav style={{ height:56, background: T.warm25, borderBottom:`1px solid ${T.warm200}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', position:'relative' }}>
        <span style={{ fontWeight:500, fontSize:16, color: T.warm900 }}>Breadly</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {env !== 'Prod' && <EnvironmentBadge env={env} />}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ width:36, height:36, borderRadius:8, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: T.warm600 }}>
            <Icon name="circle-user" size={22} />
          </button>
        </div>
        {menuOpen && (
          <div style={{ position:'absolute', top:56, right:12, width:180, background: T.warm25, border:`1px solid ${T.warm200}`, borderRadius:10, boxShadow:'0 8px 24px rgba(28,25,23,.1)', zIndex:100, overflow:'hidden' }}>
            {[{ label:'Rezepte', href:'#' }, { label:'Profil', href:'#' }, isAdmin && { label:'Gesundheit', href:'#' }, { label:'Abmelden', href:'#', danger:true }].filter(Boolean).map(item => (
              <a key={item.label} href={item.href} style={{ display:'block', padding:'10px 14px', fontSize:14, color: item.danger ? T.red500 : T.warm900, textDecoration:'none', borderBottom:`1px solid ${T.warm100}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.warm100}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >{item.label}</a>
            ))}
          </div>
        )}
      </nav>
    );
  }

  const navLinks = [
    { label: 'Rezepte', key: 'recipes' },
    isAdmin && { label: 'Gesundheit', key: 'health' },
  ].filter(Boolean);

  return (
    <nav style={{ height:56, background: T.warm25, borderBottom:`1px solid ${T.warm200}`, display:'flex', alignItems:'center', padding:'0 24px', gap:8, position:'relative' }}>
      <span style={{ fontWeight:500, fontSize:16, color: T.warm900, marginRight:24 }}>Breadly</span>
      <div style={{ display:'flex', alignItems:'center', gap:4, flex:1 }}>
        {navLinks.map(link => (
          <a key={link.key} href="#" style={{
            padding:'6px 12px', fontSize:14, fontWeight: active===link.key ? 500 : 400,
            color: active===link.key ? T.amber700 : T.warm600,
            textDecoration:'none', borderRadius:6,
            borderBottom: active===link.key ? `2px solid ${T.amber600}` : '2px solid transparent',
            transition:'color 120ms ease',
          }}
          onMouseEnter={e => { if (active!==link.key) e.currentTarget.style.color = T.warm900; }}
          onMouseLeave={e => { if (active!==link.key) e.currentTarget.style.color = T.warm600; }}
          >{link.label}</a>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {env !== 'Prod' && <EnvironmentBadge env={env} />}
        <div style={{ position:'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            display:'flex', alignItems:'center', gap:6, height:36, padding:'0 10px',
            background:'transparent', border:`1px solid transparent`, borderRadius:8, cursor:'pointer',
            color: T.warm600, fontSize:13, fontWeight:500,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.warm100; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon name="circle-user" size={20} />
            <Icon name="chevron-down" size={14} />
          </button>
          {menuOpen && (
            <div style={{ position:'absolute', top:40, right:0, width:180, background: T.warm25, border:`1px solid ${T.warm200}`, borderRadius:10, boxShadow:'0 8px 24px rgba(28,25,23,.1)', zIndex:100, overflow:'hidden' }}>
              {[{ label:'Profil', href:'#' }, isAdmin && { label:'Gesundheit', href:'#' }, null, { label:'Abmelden', href:'#', danger:true }].filter(x => x !== undefined).map((item, i) =>
                item === null
                  ? <div key={i} style={{ height:1, background: T.warm200, margin:'4px 0' }} />
                  : <a key={item.label} href={item.href} style={{ display:'block', padding:'9px 14px', fontSize:14, color: item.danger ? T.red500 : T.warm800, textDecoration:'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.warm100}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >{item.label}</a>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Export all to window for cross-script access
Object.assign(window, {
  BreadlyT: T,
  Icon, Btn, FormField, SegmentedBtn, Select,
  Tag, BakingTimeline, EnvironmentBadge, SkeletonRow, ErrorBanner, Navbar,
});
