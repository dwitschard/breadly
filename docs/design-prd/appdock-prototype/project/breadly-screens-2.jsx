// breadly-screens-2.jsx — Screens 05–10 (all new PRD entities)
const { useState, useEffect } = React;

// ── Extended sample data ─────────────────────────────────────
const FLOUR_FULL = [
{ id: 'mehl-405', sorte: 'Weizenmehl', typ: 405, chBeschreibung: 'Feines Auszugsmehl, ideal für Gebäck' },
{ id: 'mehl-550', sorte: 'Weizenmehl', typ: 550, chBeschreibung: 'Standard für Brot und Brötchen' },
{ id: 'mehl-1050', sorte: 'Weizenmehl', typ: 1050, chBeschreibung: 'Dunkles Auszugsmehl mit kräftigem Aroma' },
{ id: 'mehl-630', sorte: 'Dinkelmehl', typ: 630, chBeschreibung: 'Helles Dinkelmehl, leicht nussig' },
{ id: 'mehl-1050d', sorte: 'Dinkelmehl', typ: 1050, chBeschreibung: 'Dunkles Dinkelmehl, vollwertig' },
{ id: 'mehl-997', sorte: 'Roggenmehl', typ: 997, chBeschreibung: 'Mittleres Roggenmehl für Mischbrote' },
{ id: 'mehl-1150', sorte: 'Roggenmehl', typ: 1150, chBeschreibung: 'Dunkles Roggenmehl, kräftiger Geschmack' },
{ id: 'mehl-00', sorte: '00-Mehl', typ: null, chBeschreibung: 'Feinstes Weizenmehl für Pizza und Pasta' }];


const SAMPLE_TT = [
{ id: 'tt1', mehlName: 'Weizenmehl 550', triebmittel: 'Sauerteig', minTemp: 24, maxTemp: 28 },
{ id: 'tt2', mehlName: 'Weizenmehl 550', triebmittel: 'Hefe', minTemp: 22, maxTemp: 26 },
{ id: 'tt3', mehlName: 'Weizenmehl 1050', triebmittel: 'Sauerteig', minTemp: 25, maxTemp: 29 },
{ id: 'tt4', mehlName: 'Roggenmehl 1150', triebmittel: 'Sauerteig', minTemp: 26, maxTemp: 30 },
{ id: 'tt5', mehlName: 'Dinkelmehl 630', triebmittel: 'Sauerteig', minTemp: 22, maxTemp: 26 },
{ id: 'tt6', mehlName: 'Dinkelmehl 630', triebmittel: 'Hefe', minTemp: 20, maxTemp: 24 },
{ id: 'tt7', mehlName: '00-Mehl', triebmittel: 'Hefe', minTemp: 20, maxTemp: 24 }];


const SAMPLE_URSPRUENGE = [
{ id: 'u1', typ: 'Buch', name: 'Tartine Bread', buchseite: 78, url: null, scope: 'GLOBAL', rezeptCount: 2 },
{ id: 'u2', typ: 'Buch', name: 'Der Brotbackautomat', buchseite: null, url: null, scope: 'GLOBAL', rezeptCount: 1 },
{ id: 'u3', typ: 'Webseite', name: 'Brotdoc', buchseite: null, url: 'https://brotdoc.com', scope: 'USER#max', rezeptCount: 1 },
{ id: 'u4', typ: 'Video', name: 'Lutz Geißler Kanal', buchseite: null, url: 'https://youtube.com', scope: 'USER#max', rezeptCount: 0 }];


const SAMPLE_REMINDERS = [
{ id: 'rem1', rezeptName: 'Country Sourdough', scheduledAt: '2026-05-12T06:30', status: 'PENDING', message: 'Jetzt backen!' },
{ id: 'rem2', rezeptName: 'Olive Oil Ciabatta', scheduledAt: '2026-05-15T08:00', status: 'PENDING', message: 'Vorteig ansetzen' },
{ id: 'rem3', rezeptName: 'Mein Weizensauer', scheduledAt: '2026-05-10T07:00', status: 'SENT', message: 'Stockgare starten' }];


const DETAIL_STUFEN = [
{
  id: 's2', name: 'Levain', typ: 'Vorstufe', sortierung: 0, triebmittel: 'Sauerteig', istHauptteig: false,
  zutaten: [
  { name: 'Weizenmehl 550', typ: 'Mehl', mengeInGramm: 50, schuetttemperatur: null },
  { name: 'Wasser', typ: 'Schüttung', mengeInGramm: 50, schuetttemperatur: 26 },
  { name: 'Anstellgut', typ: 'Triebmittel', mengeInGramm: 10, schuetttemperatur: null }],

  schritte: [{ sortierung: 1, beschreibung: 'Anstellgut mit Wasser und Mehl verrühren. Abgedeckt bei Raumtemperatur gehen lassen.', dauer: { minStunden: 0, minMin: 5, maxStunden: 0, maxMin: 10 } }],
  stockgare: [{ sortierung: 1, ort: 'Raumtemperatur 24°C', dauer: { minStunden: 8, minMin: 0, maxStunden: 12, maxMin: 0 } }],
  stuckgare: []
},
{
  id: 's1', name: 'Hauptteig', typ: 'Hauptteig', sortierung: 1, triebmittel: 'Sauerteig', istHauptteig: true,
  zutaten: [
  { name: 'Weizenmehl 550', typ: 'Mehl', mengeInGramm: 500, schuetttemperatur: null },
  { name: 'Wasser', typ: 'Schüttung', mengeInGramm: 375, schuetttemperatur: 28 },
  { name: 'Salz', typ: 'Gewürz', mengeInGramm: 10, schuetttemperatur: null },
  { name: 'Levain', typ: 'Triebmittel', mengeInGramm: 110, schuetttemperatur: null }],

  schritte: [
  { sortierung: 1, beschreibung: 'Autolyse: Wasser und Mehl mischen, 30 Min. quellen lassen. Levain einfalten, dann Salz einarbeiten.', dauer: { minStunden: 0, minMin: 30, maxStunden: 0, maxMin: 45 } },
  { sortierung: 2, beschreibung: 'Dehnen & Falten alle 30 Min., 4–6 Mal wiederholen.', dauer: { minStunden: 0, minMin: 5, maxStunden: 0, maxMin: 10 } },
  { sortierung: 3, beschreibung: 'Vorformen, 20 Min. Tuchgare, endformen und in bemehlten Gärkorb legen.', dauer: { minStunden: 0, minMin: 20, maxStunden: 0, maxMin: 30 } }],

  stockgare: [{ sortierung: 1, ort: 'Raumtemperatur', dauer: { minStunden: 3, minMin: 0, maxStunden: 5, maxMin: 0 } }],
  stuckgare: [{ sortierung: 1, ort: 'Kühlschrank 5°C', dauer: { minStunden: 8, minMin: 0, maxStunden: 16, maxMin: 0 } }]
}];


const DETAIL_BACKVORGAENGE = [
{ sortierung: 1, grad: 250, ofeneinstellung: 'Ober-/Unterhitze', dampf: true, gusseisentopf: true, dauer: { minStunden: 0, minMin: 20, maxStunden: 0, maxMin: 25 } },
{ sortierung: 2, grad: 220, ofeneinstellung: 'Ober-/Unterhitze', dampf: false, gusseisentopf: true, dauer: { minStunden: 0, minMin: 20, maxStunden: 0, maxMin: 25 } }];


const DETAIL_BEWERTUNGEN = [
{ userId: 'anna', userName: 'Anna K.', wertung: 4, datum: '28. Mär 2024', notizen: 'Sehr gutes Rezept – beim nächsten Mal etwas mehr Salz.' }];


// ── Helpers ──────────────────────────────────────────────────
function fmtDR(d) {
  const f = (h, m) => `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'min' : ''}`.trim() || '–';
  const mn = f(d.minStunden, d.minMin);
  const mx = f(d.maxStunden, d.maxMin);
  return mn === mx ? mn : `${mn} – ${mx}`;
}
function fmtDT(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch (e) {return iso;}
}

// ── Shared sub-components ────────────────────────────────────
function SecLabel({ children }) {
  const T = window.BreadlyT;
  return <div style={{ fontSize: 11, fontWeight: 500, color: T.warm400, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '18px 0 8px' }}>{children}</div>;
}

function InfoGrid({ rows }) {
  const T = window.BreadlyT;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 8, border: `1px solid ${T.warm200}`, overflow: 'hidden' }}>
      {rows.map((r, i) =>
      <div key={r.label} style={{
        padding: '10px 14px',
        borderBottom: i < rows.length - 2 ? `1px solid ${T.warm100}` : 'none',
        borderRight: i % 2 === 0 ? `1px solid ${T.warm100}` : 'none'
      }}>
          <div style={{ fontSize: 10, color: T.warm400, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>{r.label}</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.warm900, fontFamily: r.mono ? "'Geist Mono',monospace" : 'inherit' }}>{r.value}</div>
        </div>
      )}
    </div>);

}

function SettingsRow({ label, desc, mobile, children }) {
  const T = window.BreadlyT;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr auto', gap: mobile ? 8 : 24, alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${T.warm100}` }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.warm900 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: T.warm500, marginTop: 2 }}>{desc}</div>}
      </div>
      <div>{children}</div>
    </div>);

}

function StufenBlock({ stufe }) {
  const T = window.BreadlyT;
  const [open, setOpen] = useState(stufe.istHauptteig);
  return (
    <div style={{ border: `1px solid ${T.warm200}`, borderRadius: 10, overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: T.warm25, cursor: 'pointer' }}>
        <window.Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={T.warm500} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: T.warm900 }}>{stufe.name}</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {stufe.istHauptteig && <window.Tag variant="amber">Hauptteig</window.Tag>}
          <window.Tag variant="neutral">{stufe.typ}</window.Tag>
          <window.Tag variant="info">{stufe.triebmittel}</window.Tag>
        </div>
      </div>
      {open &&
      <div style={{ padding: '0 16px 18px' }}>
          <SecLabel>Zutaten</SecLabel>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.warm200}` }}>
                {['Zutat', 'Typ', 'Menge'].map((h) =>
                  <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, fontWeight: 500, color: T.warm500, letterSpacing: '0.04em' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {stufe.zutaten.map((z, i) =>
                <tr key={i} style={{ borderBottom: `1px solid ${T.warm100}` }}>
                  <td style={{ padding: '8px', fontWeight: 500, color: T.warm900 }}>{z.name}</td>
                  <td style={{ padding: '8px', color: T.warm500 }}>{z.typ}</td>
                  <td style={{ padding: '8px', fontFamily: "'Geist Mono',monospace", color: T.warm700 }}>
                    {z.mengeInGramm}g
                    {z.typ === 'Schüttung' && z.schuetttemperatur &&
                      <span style={{ marginLeft: 6, fontSize: 11, color: T.warm400 }}>@ {z.schuetttemperatur}°C</span>
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <SecLabel>Schritte</SecLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stufe.schritte.map((s, i) =>
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: T.warm50, borderRadius: 8, border: `1px solid ${T.warm100}` }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.amber600, color: '#FBF7F1', fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{s.sortierung}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: T.warm900, lineHeight: 1.55 }}>{s.beschreibung}</div>
                  <div style={{ fontSize: 11, color: T.warm400, fontFamily: "'Geist Mono',monospace", marginTop: 3 }}>{fmtDR(s.dauer)}</div>
                </div>
              </div>
          )}
          </div>

          {(stufe.stockgare.length > 0 || stufe.stuckgare.length > 0) &&
        <div style={{ display: 'grid', gridTemplateColumns: stufe.stuckgare.length > 0 ? '1fr 1fr' : '1fr', gap: 10, marginTop: 12 }}>
              {stufe.stockgare.length > 0 &&
          <div style={{ background: T.amber50, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.amber200}` }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: T.warm400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Stockgare</div>
                  {stufe.stockgare.map((g, i) =>
            <div key={i} style={{ fontSize: 13, color: T.warm800 }}>{g.ort} · <span style={{ fontFamily: "'Geist Mono',monospace" }}>{fmtDR(g.dauer)}</span></div>
            )}
                </div>
          }
              {stufe.stuckgare.length > 0 &&
          <div style={{ background: T.slate100, borderRadius: 8, padding: '12px 14px', border: `1px solid ${T.slate200}` }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: T.warm400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Stückgare</div>
                  {stufe.stuckgare.map((g, i) =>
            <div key={i} style={{ fontSize: 13, color: T.warm800 }}>{g.ort} · <span style={{ fontFamily: "'Geist Mono',monospace" }}>{fmtDR(g.dauer)}</span></div>
            )}
                </div>
          }
            </div>
        }
        </div>
      }
    </div>);

}

function StarPicker({ value, onChange }) {
  const T = window.BreadlyT;
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) =>
      <span key={i} onClick={() => onChange(i)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(0)}
      style={{ fontSize: 30, color: i <= (hov || value) ? T.amber500 : T.warm200, cursor: 'pointer', transition: 'color 80ms ease', lineHeight: 1, userSelect: 'none' }}>★</span>
      )}
    </div>);

}

function BewertungCard({ b }) {
  const T = window.BreadlyT;
  return (
    <div style={{ padding: '14px 16px', background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.warm900 }}>{b.userName}</span>
          <span style={{ fontSize: 12, color: T.warm400, fontFamily: "'Geist Mono',monospace" }}>{b.datum}</span>
        </div>
        <span>{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= b.wertung ? T.amber500 : T.warm200, fontSize: 14 }}>★</span>)}</span>
      </div>
      {b.notizen && <p style={{ fontSize: 13, color: T.warm600, lineHeight: 1.5, margin: 0 }}>{b.notizen}</p>}
    </div>);

}

// ══════════════════════════════════════════════════════════════
// SCREEN 05 — Rezept Detail
// ══════════════════════════════════════════════════════════════
function RecipeDetailScreen({ mobile, loading }) {
  const T = window.BreadlyT;
  const w = mobile ? 375 : 1280;
  const [myRating, setMyRating] = useState(0);
  const [myNote, setMyNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const recipe = {
    titel: 'Country Sourdough', scope: 'GLOBAL', bewertung: 4.5,
    menge: { beschreibung: 'Laibe', anzahl: 2 }, erstelldatum: '15. Mär 2024',
    gesamtdauerMin: 810, gesamtdauerMax: 960, teigausbeute: 178,
    durchschnittlicherMehltyp: 550,
    ursprung: { typ: 'Buch', name: 'Tartine Bread', buchseite: 78 }
  };

  const timelineSteps = [
  { name: 'Levain', mins: 600, type: 'wait' },
  { name: 'Autolyse', mins: 35, type: 'active' },
  { name: 'Falten', mins: 120, type: 'wait' },
  { name: 'Formen', mins: 25, type: 'active' },
  { name: 'Stückgare', mins: 480, type: 'wait' },
  { name: 'Backen', mins: 45, type: 'active' }];


  return (
    <div style={{ width: w, minHeight: mobile ? 1900 : 1560, background: T.warm50 }}>
      <window.Navbar active="recipes" mobile={mobile} env="Lokal" />
      <div style={{ maxWidth: mobile ? '100%' : 900, margin: '0 auto', padding: mobile ? '16px 16px' : '32px 40px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: T.warm500 }}>
          <window.Icon name="chevron-left" size={14} color={T.warm400} />
          <span>Rezepte</span>
          <window.Icon name="chevron-right" size={12} color={T.warm300} />
          <span style={{ color: T.warm900, fontWeight: 500 }}>{recipe.titel}</span>
        </div>

        {loading ?
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{ width: 48, height: 48, border: `4px solid ${T.amber600}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 700ms linear infinite', display: 'inline-block' }} />
          </div> :
        <>

        {/* Header card */}
        <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 14, padding: mobile ? 20 : 28, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <window.Tag variant="info">Global</window.Tag>
                <window.Tag variant="success" dot>Verifiziert</window.Tag>
              </div>
              <h1 style={{ fontSize: mobile ? 22 : 30, fontWeight: 500, color: T.warm900, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{recipe.titel}</h1>
              <p style={{ fontSize: 13, color: T.warm500, marginTop: 8 }}>
                {recipe.ursprung.typ}: {recipe.ursprung.name}, S.&nbsp;{recipe.ursprung.buchseite}
              </p>
            </div>
            {!mobile &&
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <window.Btn variant="secondary" icon="pencil">Bearbeiten</window.Btn>
                <window.Btn variant="primary" icon="copy">Fork</window.Btn>
              </div>
              }
          </div>

          <InfoGrid rows={[
            { label: 'TA (Teigausbeute)', value: `${recipe.teigausbeute}`, mono: true },
            { label: 'Ø Mehltyp', value: `Type ${recipe.durchschnittlicherMehltyp}`, mono: true },
            { label: 'Dauer', value: `${Math.floor(recipe.gesamtdauerMin / 60)}h – ${Math.floor(recipe.gesamtdauerMax / 60)}h`, mono: true },
            { label: 'Menge', value: `${recipe.menge.anzahl} ${recipe.menge.beschreibung}`, mono: false },
            { label: 'Bewertung', value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ color: i <= Math.round(recipe.bewertung) ? T.amber500 : T.warm200, fontSize: 14 }}>★</span>)}<span style={{ fontFamily: "'Geist Mono',monospace", fontSize: 12, color: T.warm600, marginLeft: 4 }}>{recipe.bewertung.toFixed(1)}</span></span> },
            { label: 'Erstellt', value: recipe.erstelldatum, mono: false }]
            } />

          {/* "Fertig um" calculator */}
          {(() => {
            const now = new Date();
            const minFinish = new Date(now.getTime() + recipe.gesamtdauerMin * 60000);
            const maxFinish = new Date(now.getTime() + recipe.gesamtdauerMax * 60000);
            const fmt = d => d.toLocaleString('de-DE', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
            const sameDay = minFinish.toDateString() === now.toDateString();
            return (
              <div style={{ marginTop: 14, display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:T.amber50, border:`1px solid ${T.amber200}`, borderRadius:10 }}>
                <window.Icon name="clock" size={18} color={T.amber700} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, fontWeight:500, color:T.amber700, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:3 }}>Jetzt starten — fertig um</div>
                  <div style={{ fontSize:15, fontWeight:500, color:T.warm900, fontFamily:"'Geist Mono',monospace" }}>
                    {fmt(minFinish)} – {fmt(maxFinish)}
                  </div>
                  <div style={{ fontSize:12, color:T.warm500, marginTop:2 }}>
                    {sameDay ? 'Noch heute' : `In ${Math.round(recipe.gesamtdauerMin/60)}–${Math.round(recipe.gesamtdauerMax/60)} Stunden`}
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: T.warm400, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Backplan</div>
            <window.BakingTimeline steps={timelineSteps} startTime={new Date()} />
          </div>
        </div>

        {/* Stufen */}
        <SecLabel>Stufen</SecLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
          {DETAIL_STUFEN.sort((a, b) => a.sortierung - b.sortierung).map((s) =>
            <StufenBlock key={s.id} stufe={s} />
            )}
        </div>

        {/* Backvorgänge */}
        <SecLabel>Backvorgänge</SecLabel>
        <div style={{ display:'flex', flexDirection: mobile ? 'column' : 'row', gap:0, alignItems: mobile ? 'stretch' : 'stretch', marginBottom:4, position:'relative' }}>
          {DETAIL_BACKVORGAENGE.map((b, i) => {
            const isLast = i === DETAIL_BACKVORGAENGE.length - 1;
            const prevDampf = i > 0 ? DETAIL_BACKVORGAENGE[i-1].dampf : null;
            const dampfChanged = prevDampf !== null && prevDampf !== b.dampf;
            return (
              <React.Fragment key={i}>
                <div style={{
                  flex:1,
                  background: T.warm25,
                  border: `1px solid ${T.warm200}`,
                  borderRadius: mobile ? 10 : (i === 0 ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : 0),
                  borderLeft: !mobile && i > 0 ? 'none' : undefined,
                  padding:'18px 20px',
                  display:'flex', flexDirection:'column', gap:12,
                  position:'relative',
                }}>
                  {/* Phase header */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:500, color:T.warm400, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:4 }}>Phase {b.sortierung}</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                        <span style={{ fontSize:28, fontWeight:500, color:T.warm900, fontFamily:"'Geist Mono',monospace", letterSpacing:'-0.02em' }}>{b.grad}°</span>
                        <span style={{ fontSize:13, color:T.warm500 }}>C · {b.ofeneinstellung}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:13, fontWeight:500, color:T.warm600, textAlign:'right', paddingTop:2 }}>
                      {fmtDR(b.dauer)}
                    </div>
                  </div>

                  {/* Dampf + Deckel row */}
                  <div style={{ display:'flex', gap:8 }}>
                    {/* Dampf */}
                    <div style={{
                      flex:1, display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                      borderRadius:8,
                      background: b.dampf ? `${T.slate100}` : T.warm100,
                      border: `1px solid ${b.dampf ? T.slate200 : T.warm200}`,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={b.dampf ? T.slate600 : T.warm300} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2c0 2.5 4 2.5 4 5s-4 2.5-4 5" />
                        <path d="M16 2c0 2.5-4 2.5-4 5s4 2.5 4 5" />
                        <path d="M12 2c0 2.5 2 2.5 2 5s-2 2.5-2 5" />
                        <rect x="4" y="17" width="16" height="4" rx="1" />
                      </svg>
                      <div>
                        <div style={{ fontSize:11, fontWeight:500, color: b.dampf ? T.slate600 : T.warm400 }}>Dampf</div>
                        <div style={{ fontSize:10, color: b.dampf ? T.slate500 : T.warm300 }}>{b.dampf ? 'Ein' : 'Aus'}</div>
                      </div>
                      {dampfChanged && (
                        <span style={{ marginLeft:'auto', fontSize:9, fontWeight:500, padding:'2px 5px', borderRadius:3, background: b.dampf ? T.slate200 : T.amber100, color: b.dampf ? T.slate700 : T.amber800 }}>
                          {b.dampf ? '↑ Ein' : '↓ Aus'}
                        </span>
                      )}
                    </div>

                    {/* Deckel */}
                    <div style={{
                      flex:1, display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                      borderRadius:8,
                      background: b.gusseisentopf ? T.amber50 : T.warm100,
                      border: `1px solid ${b.gusseisentopf ? T.amber200 : T.warm200}`,
                    }}>
                      <window.Icon name="circle" size={16} color={b.gusseisentopf ? T.amber700 : T.warm300} />
                      <div>
                        <div style={{ fontSize:11, fontWeight:500, color: b.gusseisentopf ? T.amber700 : T.warm400 }}>Topf</div>
                        <div style={{ fontSize:10, color: b.gusseisentopf ? T.amber600 : T.warm300 }}>{b.gusseisentopf ? 'Geschlossen' : 'Geöffnet'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow connector */}
                {!isLast && (
                  mobile
                    ? <div style={{ display:'flex', justifyContent:'center', padding:'6px 0', color:T.warm300 }}>
                        <window.Icon name="chevron-down" size={18} color={T.warm300} />
                      </div>
                    : <div style={{ width:0, display:'flex', alignItems:'center', zIndex:1, position:'relative' }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:T.warm100, border:`1px solid ${T.warm200}`, display:'flex', alignItems:'center', justifyContent:'center', position:'absolute', left:-14, zIndex:2 }}>
                          <window.Icon name="chevron-right" size={14} color={T.warm400} />
                        </div>
                      </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Bewertungen */}
        <SecLabel>Bewertungen</SecLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {DETAIL_BEWERTUNGEN.map((b) => <BewertungCard key={b.userId} b={b} />)}
        </div>

        {/* Add rating */}
        {!submitted ?
          <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 10, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: T.warm900 }}>Eigene Bewertung</div>
            <StarPicker value={myRating} onChange={setMyRating} />
            <textarea value={myNote} onChange={(e) => setMyNote(e.target.value)} placeholder="Notizen (optional)…"
            rows={3} style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.warm300}`, borderRadius: 8, fontFamily: "'Geist',sans-serif", fontSize: 14, color: T.warm900, background: T.warm25, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <window.Btn variant="primary" disabled={myRating === 0} onClick={() => setSubmitted(true)}>Bewertung speichern</window.Btn>
            </div>
          </div> :

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: T.greenBg, borderRadius: 10 }}>
            <window.Icon name="check-circle" size={18} color={T.green500} />
            <span style={{ fontSize: 14, color: T.greenText, fontWeight: 500 }}>Bewertung gespeichert.</span>
          </div>
          }

        </>}
      </div>
    </div>);

}

// ══════════════════════════════════════════════════════════════
// SCREEN 06 — Mehl Katalog
// ══════════════════════════════════════════════════════════════
function MehlKatalogScreen({ mobile }) {
  const T = window.BreadlyT;
  const w = mobile ? 375 : 1280;
  const [search, setSearch] = useState('');
  const filtered = FLOUR_FULL.filter((f) =>
  !search || f.sorte.toLowerCase().includes(search.toLowerCase()) || String(f.typ ?? '').includes(search)
  );
  const groups = [...new Set(filtered.map((f) => f.sorte))];

  return (
    <div style={{ width: w, minHeight: mobile ? 720 : 680, background: T.warm50 }}>
      <window.Navbar mobile={mobile} env="Lokal" />
      <div style={{ maxWidth: mobile ? '100%' : 900, margin: '0 auto', padding: mobile ? '20px 16px' : '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 500, color: T.warm900, letterSpacing: '-0.02em' }}>Mehl Katalog</h1>
            <p style={{ fontSize: 13, color: T.warm400, marginTop: 3 }}>{filtered.length} Mehle</p>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}><window.Icon name="search" size={14} color={T.warm400} /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen…"
            style={{ height: 36, padding: '0 12px 0 32px', border: `1px solid ${T.warm300}`, borderRadius: 8, fontFamily: "'Geist',sans-serif", fontSize: 14, color: T.warm900, background: T.warm25, outline: 'none', width: mobile ? '140px' : '220px' }} />
          </div>
        </div>
        <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: T.warm100, borderBottom: `1px solid ${T.warm200}` }}>
                {['Sorte', 'Typ', 'CH-Beschreibung'].map((h) =>
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 500, color: T.warm500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const items = filtered.filter((f) => f.sorte === g);
                return items.map((f, i) =>
                <tr key={f.id} style={{ borderBottom: `1px solid ${T.warm100}`, cursor: 'default' }}
                onMouseEnter={(e) => e.currentTarget.style.background = T.warm50}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 16px', fontWeight: i === 0 ? 500 : 400, color: i === 0 ? T.warm900 : T.warm600 }}>{i === 0 ? f.sorte : ''}</td>
                    <td style={{ padding: '11px 16px', fontFamily: "'Geist Mono',monospace", color: T.warm700 }}>{f.typ ?? '–'}</td>
                    <td style={{ padding: '11px 16px', color: T.warm600, fontSize: 13 }}>{f.chBeschreibung}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}

// ══════════════════════════════════════════════════════════════
// SCREEN 07 — Teigtemperaturen
// ══════════════════════════════════════════════════════════════
function TeigtemperaturScreen({ mobile }) {
  const T = window.BreadlyT;
  const w = mobile ? 375 : 1280;
  const [triebmittel, setTriebmittel] = useState('alle');
  const rows = SAMPLE_TT.filter((r) => triebmittel === 'alle' || r.triebmittel === triebmittel);

  return (
    <div style={{ width: w, minHeight: mobile ? 620 : 560, background: T.warm50 }}>
      <window.Navbar mobile={mobile} env="Lokal" />
      <div style={{ maxWidth: mobile ? '100%' : 900, margin: '0 auto', padding: mobile ? '20px 16px' : '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: mobile ? 'flex-start' : 'center', flexDirection: mobile ? 'column' : 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 500, color: T.warm900, letterSpacing: '-0.02em' }}>Teigtemperaturen</h1>
            <p style={{ fontSize: 13, color: T.warm400, marginTop: 3 }}>Empfohlene Schütttemperatur je Mehl &amp; Triebmittel</p>
          </div>
          <window.SegmentedBtn
            options={[{ value: 'alle', label: 'Alle' }, { value: 'Sauerteig', label: 'Sauerteig' }, { value: 'Hefe', label: 'Hefe' }]}
            value={triebmittel} onChange={setTriebmittel} />
          
        </div>
        <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: T.warm100, borderBottom: `1px solid ${T.warm200}` }}>
                {['Mehl', 'Triebmittel', 'Min.', 'Max.', 'Bereich'].map((h) =>
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 500, color: T.warm500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) =>
              <tr key={r.id} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${T.warm100}` : 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.warm50}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: T.warm900 }}>{r.mehlName}</td>
                  <td style={{ padding: '12px 16px' }}><window.Tag variant={r.triebmittel === 'Sauerteig' ? 'amber' : 'info'}>{r.triebmittel}</window.Tag></td>
                  <td style={{ padding: '12px 16px', fontFamily: "'Geist Mono',monospace", color: T.warm700 }}>{r.minTemp}°C</td>
                  <td style={{ padding: '12px 16px', fontFamily: "'Geist Mono',monospace", color: T.warm700 }}>{r.maxTemp}°C</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ position: 'relative', height: 8, width: 120, background: T.warm100, borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: `${(r.minTemp - 18) / (35 - 18) * 100}%`, width: `${(r.maxTemp - r.minTemp) / (35 - 18) * 100}%`, top: 0, bottom: 0, background: T.amber600, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 10, color: T.warm400, marginTop: 3, fontFamily: "'Geist Mono',monospace" }}>{r.minTemp}–{r.maxTemp}°C</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: T.warm400, marginTop: 12, lineHeight: 1.6 }}>
          Wird bei Rezept-Stufen anhand von Mehltyp und Triebmittel automatisch ermittelt.
        </p>
      </div>
    </div>);

}

// ══════════════════════════════════════════════════════════════
// SCREEN 08 — Ursprünge
// ══════════════════════════════════════════════════════════════
function UrsprungScreen({ mobile, showCreate }) {
  const T = window.BreadlyT;
  const w = mobile ? 375 : 1280;
  const [origins, setOrigins] = useState(SAMPLE_URSPRUENGE);
  const [creating, setCreating] = useState(showCreate || false);
  const [typ, setTyp] = useState('Buch');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [seite, setSeite] = useState('');
  const [deleting, setDeleting] = useState(null);

  const typIcon = { Buch: 'book-open', Webseite: 'globe', Video: 'play-circle', Person: 'circle-user' };
  const groups = [
  { label: 'Global', items: origins.filter((o) => o.scope === 'GLOBAL') },
  { label: 'Meine', items: origins.filter((o) => o.scope !== 'GLOBAL') }].
  filter((g) => g.items.length > 0);

  function save() {
    setOrigins((prev) => [...prev, { id: 'u' + Date.now(), typ, name, buchseite: seite || null, url: url || null, scope: 'USER#max', rezeptCount: 0 }]);
    setCreating(false);setName('');setUrl('');setSeite('');
  }

  return (
    <div style={{ width: w, minHeight: mobile ? 740 : 720, background: T.warm50 }}>
      <window.Navbar mobile={mobile} env="Lokal" />
      <div style={{ maxWidth: mobile ? '100%' : 900, margin: '0 auto', padding: mobile ? '20px 16px' : '32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 500, color: T.warm900, letterSpacing: '-0.02em' }}>Quellen</h1>
            <p style={{ fontSize: 13, color: T.warm400, marginTop: 3 }}>Quellen und Referenzen für Rezepte</p>
          </div>
          <window.Btn variant="primary" icon="plus" onClick={() => setCreating(true)}>Neuer Ursprung</window.Btn>
        </div>

        {creating &&
        <div style={{ background: T.warm25, border: `1px solid ${T.amber200}`, borderRadius: 12, padding: mobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: T.warm900 }}>Neue Quelle</div>
            <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: T.warm900 }}>Typ</label>
                <window.Select value={typ} onChange={setTyp} options={['Buch', 'Webseite', 'Video', 'Person'].map((v) => ({ value: v, label: v }))} width={130} />
              </div>
              <window.FormField label="Name" value={name} onChange={setName} placeholder="z.B. Tartine Bread" style={{ flex: 1 }} />
              {typ === 'Buch' ?
            <window.FormField label="Seite" value={seite} onChange={setSeite} placeholder="78" type="number" style={{ width: 80 }} /> :
            <window.FormField label="URL" value={url} onChange={setUrl} placeholder="https://…" style={{ flex: 1 }} />
            }
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${T.warm100}`, paddingTop: 12 }}>
              <window.Btn variant="ghost" onClick={() => setCreating(false)}>Abbrechen</window.Btn>
              <window.Btn variant="primary" disabled={!name.trim()} onClick={save}>Speichern</window.Btn>
            </div>
          </div>
        }

        {groups.map((g) =>
        <div key={g.label}>
            <div style={{ fontSize: 11, fontWeight: 500, color: T.warm400, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{g.label}</div>
            <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 12, overflow: 'hidden' }}>
              {g.items.map((o, i) =>
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < g.items.length - 1 ? `1px solid ${T.warm100}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: T.warm100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <window.Icon name={typIcon[o.typ] || 'file'} size={17} color={T.warm500} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.warm900 }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: T.warm500, marginTop: 1 }}>
                      {o.typ}
                      {o.buchseite ? ` · S. ${o.buchseite}` : ''}
                      {o.url ? ` · ${o.url}` : ''}
                      {' · '}
                      {o.rezeptCount} {o.rezeptCount === 1 ? 'Rezept' : 'Rezepte'}
                    </div>
                  </div>
                  {o.scope !== 'GLOBAL' && (
              deleting === o.id ?
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: T.warm600 }}>Löschen?</span>
                        <window.Btn variant="danger" size="sm" onClick={() => {setOrigins((p) => p.filter((x) => x.id !== o.id));setDeleting(null);}}>Ja</window.Btn>
                        <window.Btn variant="ghost" size="sm" onClick={() => setDeleting(null)}>Nein</window.Btn>
                      </div> :

              <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ width: 30, height: 30, border: `1px solid ${T.warm200}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.warm400 }}>
                          <window.Icon name="pencil" size={13} />
                        </button>
                        <button onClick={() => o.rezeptCount > 0 ? null : setDeleting(o.id)}
                title={o.rezeptCount > 0 ? 'Wird noch verwendet' : 'Löschen'}
                style={{ width: 30, height: 30, border: `1px solid ${T.warm200}`, borderRadius: 6, background: 'transparent', cursor: o.rezeptCount > 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: o.rezeptCount > 0 ? T.warm300 : T.warm400, opacity: o.rezeptCount > 0 ? 0.5 : 1 }}>
                          <window.Icon name="trash-2" size={13} />
                        </button>
                      </div>)

              }
                </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>);

}

// ══════════════════════════════════════════════════════════════
// SCREEN 09 — Einstellungen
// ══════════════════════════════════════════════════════════════
function EinstellungenScreen({ mobile }) {
  const T = window.BreadlyT;
  const w = mobile ? 375 : 1280;
  const [lang, setLang] = useState('de');
  const [theme, setTheme] = useState('light');
  const [notifOn, setNotifOn] = useState(true);
  const [saved, setSaved] = useState(false);

  function Toggle({ on, onToggle }) {
    return (
      <span onClick={onToggle} style={{ position: 'relative', width: 36, height: 20, background: on ? T.amber600 : T.warm300, borderRadius: 99, cursor: 'pointer', transition: 'background 150ms ease', display: 'inline-block', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 150ms ease', boxShadow: '0 1px 2px rgba(28,25,23,0.15)' }} />
      </span>);

  }

  return (
    <div style={{ width: w, minHeight: mobile ? 700 : 660, background: T.warm50 }}>
      <window.Navbar mobile={mobile} env="Lokal" />
      <div style={{ maxWidth: mobile ? '100%' : 768, margin: '0 auto', padding: mobile ? '20px 16px' : '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 500, color: T.warm900, letterSpacing: '-0.02em' }}>Einstellungen</h1>

        <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: T.warm100, fontSize: 11, fontWeight: 500, color: T.warm400, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Darstellung</div>
          <SettingsRow label="Sprache" desc="Anzeigesprache der App" mobile={mobile}>
            <window.SegmentedBtn options={[{ value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }]} value={lang} onChange={setLang} />
          </SettingsRow>
          <SettingsRow label="Theme" desc="Erscheinungsbild" mobile={mobile}>
            <window.SegmentedBtn options={[{ value: 'light', label: 'Hell' }, { value: 'dark', label: 'Dunkel' }, { value: 'system', label: 'System' }]} value={theme} onChange={setTheme} />
          </SettingsRow>
        </div>

        <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: T.warm100, fontSize: 11, fontWeight: 500, color: T.warm400, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Benachrichtigungen</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${T.warm100}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.warm900 }}>Erinnerungen</div>
              <div style={{ fontSize: 12, color: T.warm500, marginTop: 2 }}>Push-Benachrichtigungen für Backpläne</div>
            </div>
            <Toggle on={notifOn} onToggle={() => setNotifOn(!notifOn)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: T.warm900 }}>E-Mail-Zusammenfassung</div>
              <div style={{ fontSize: 12, color: T.warm500, marginTop: 2 }}>Wöchentliche Statistik per E-Mail</div>
            </div>
            <Toggle on={false} onToggle={() => {}} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <window.Btn variant="ghost" onClick={() => setSaved(false)}>Zurücksetzen</window.Btn>
          <window.Btn variant="primary" onClick={() => setSaved(true)}>{saved ? 'Gespeichert ✓' : 'Speichern'}</window.Btn>
        </div>
      </div>
    </div>);

}

// ══════════════════════════════════════════════════════════════
// SCREEN 10 — Erinnerungen
// ══════════════════════════════════════════════════════════════
function ErinnerungenScreen({ mobile, empty }) {
  const T = window.BreadlyT;
  const w = mobile ? 375 : 1280;
  const [reminders, setReminders] = useState(empty ? [] : SAMPLE_REMINDERS);
  const [creating, setCreating] = useState(false);
  const [recipe, setRecipe] = useState('r1');
  const [when, setWhen] = useState('2026-05-20T07:00');
  const [msg, setMsg] = useState('');

  const statusStyle = { PENDING: { bg: T.amber100, color: T.amber800 }, SENT: { bg: T.warm100, color: T.warm500 } };
  const recipeNames = { r1: 'Country Sourdough', r2: 'Olive Oil Ciabatta', r5: 'Mein Weizensauer' };

  function addReminder() {
    setReminders((p) => [{ id: 'rem' + Date.now(), rezeptName: recipeNames[recipe], scheduledAt: when, status: 'PENDING', message: msg || 'Erinnerung' }, ...p]);
    setCreating(false);setMsg('');
  }

  return (
    <div style={{ width: w, minHeight: mobile ? 680 : 640, background: T.warm50 }}>
      <window.Navbar mobile={mobile} env="Lokal" />
      <div style={{ maxWidth: mobile ? '100%' : 768, margin: '0 auto', padding: mobile ? '20px 16px' : '32px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 500, color: T.warm900, letterSpacing: '-0.02em' }}>Erinnerungen</h1>
            <p style={{ fontSize: 13, color: T.warm400, marginTop: 3 }}>{reminders.length} {reminders.length === 1 ? 'Erinnerung' : 'Erinnerungen'}</p>
          </div>
          <window.Btn variant="primary" icon="plus" onClick={() => setCreating(true)}>Neue Erinnerung</window.Btn>
        </div>

        {creating &&
        <div style={{ background: T.warm25, border: `1px solid ${T.amber200}`, borderRadius: 12, padding: mobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: T.warm900 }}>Neue Erinnerung</div>
            <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: T.warm900 }}>Rezept</label>
                <window.Select value={recipe} onChange={setRecipe} options={Object.entries(recipeNames).map(([v, l]) => ({ value: v, label: l }))} width={mobile ? 300 : 220} />
              </div>
              <window.FormField label="Zeitpunkt" type="datetime-local" value={when} onChange={setWhen} style={{ flex: 1 }} />
            </div>
            <window.FormField label="Nachricht (optional)" value={msg} onChange={setMsg} placeholder="z.B. Stückgare beginnen" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${T.warm100}`, paddingTop: 12 }}>
              <window.Btn variant="ghost" onClick={() => setCreating(false)}>Abbrechen</window.Btn>
              <window.Btn variant="primary" onClick={addReminder}>Speichern</window.Btn>
            </div>
          </div>
        }

        {reminders.length === 0 ?
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 24px', background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 10 }}>
            <window.Icon name="clock" size={28} color={T.warm300} />
            <p style={{ fontSize: 14, color: T.warm500, textAlign: 'center' }}>Keine Erinnerungen vorhanden.<br />Erstelle eine für deinen nächsten Backplan.</p>
            <window.Btn variant="primary" icon="plus" onClick={() => setCreating(true)}>Neue Erinnerung</window.Btn>
          </div> :

        <div style={{ background: T.warm25, border: `1px solid ${T.warm200}`, borderRadius: 12, overflow: 'hidden' }}>
            {reminders.map((r, i) => {
            const s = statusStyle[r.status] || statusStyle.SENT;
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < reminders.length - 1 ? `1px solid ${T.warm100}` : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <window.Icon name={r.status === 'SENT' ? 'check' : 'clock'} size={16} color={s.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: T.warm900 }}>{r.rezeptName}</div>
                    <div style={{ fontSize: 12, color: T.warm500, marginTop: 1, fontFamily: "'Geist Mono',monospace" }}>{fmtDT(r.scheduledAt)}</div>
                    {r.message && <div style={{ fontSize: 12, color: T.warm400, marginTop: 1 }}>{r.message}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color }}>{r.status}</span>
                    {r.status === 'PENDING' &&
                  <button onClick={() => setReminders((p) => p.filter((x) => x.id !== r.id))}
                  style={{ width: 28, height: 28, border: `1px solid ${T.warm200}`, borderRadius: 6, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.warm400 }}>
                        <window.Icon name="trash-2" size={13} />
                      </button>
                  }
                  </div>
                </div>);

          })}
          </div>
        }
      </div>
    </div>);

}

// ── Export all to window ─────────────────────────────────────
Object.assign(window, {
  RecipeDetailScreen, MehlKatalogScreen, TeigtemperaturScreen,
  UrsprungScreen, EinstellungenScreen, ErinnerungenScreen
});