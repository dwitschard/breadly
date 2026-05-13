// AppDock Shell — login + account + app-launcher screens.
// Built on current tokens: --accent (deep amber), --accent-soft, neutral
// surfaces, ad-btn-accent for hero CTAs.

const { useState } = React;

function LoginScreen({ onSignIn }) {
  return (
    <div style={{
      maxWidth: 380, margin: "0 auto", padding: "96px 24px 120px",
      display: "flex", flexDirection: "column", gap: 36,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <AppDockMark size={44} color="var(--accent)" />
        <h1 className="ad-h1" style={{ textAlign: "center", margin: 0 }}>Sign in to AppDock</h1>
        <p className="ad-p" style={{ color: "var(--fg-muted)", textAlign: "center", margin: 0 }}>
          One identity for every home app.
        </p>
      </div>
      <form style={{ display: "flex", flexDirection: "column", gap: 14 }}
            onSubmit={(e) => { e.preventDefault(); onSignIn && onSignIn(); }}>
        <Field label="Email">
          <Input type="email" placeholder="you@home.example" defaultValue="lou@home.example" />
        </Field>
        <Field label="Password">
          <Input type="password" defaultValue="••••••••••" />
        </Field>
        <button type="submit" className="ad-btn ad-btn-accent ad-btn-lg" style={{ width: "100%" }}>
          Continue
        </button>
        <button type="button" className="ad-btn ad-btn-quiet ad-btn-sm" style={{ alignSelf: "center" }}>
          Use a passkey instead
        </button>
      </form>
      <div style={{ textAlign: "center" }}>
        <span className="ad-caption">New here? </span>
        <a href="#" style={{ color: "var(--accent)", fontSize: 12, textDecoration: "none", fontWeight: 500 }}>Create an account</a>
      </div>
    </div>
  );
}

function LauncherScreen({ onOpenApp }) {
  const apps = [
    { id: "breadly",  label: "Breadly",  desc: "Bread recipes &\nbake schedules", icon: "cookie",       live: true },
    { id: "calendar", label: "Calendar", desc: "Shared family\nschedule",          icon: "calendar",     live: false },
    { id: "notes",    label: "Notes",    desc: "Plain quick notes\nfor the home",  icon: "notebook-pen", live: false },
  ];
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px 120px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 36 }}>
        <span className="ad-eyebrow">Your dock</span>
        <h1 className="ad-h1" style={{ margin: 0 }}>Good morning, Lou.</h1>
        <p className="ad-p" style={{ color: "var(--fg-muted)", margin: 0 }}>
          Pick an app to open, or stay on the counter.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {apps.map(a => (
          <button key={a.id}
                  onClick={() => a.live && onOpenApp && onOpenApp(a.id)}
                  className="ad-card"
                  style={{
                    textAlign: "left", cursor: a.live ? "pointer" : "default",
                    background: "var(--bg-elevated)", padding: 18,
                    display: "flex", flexDirection: "column", gap: 14,
                    transition: "border-color 120ms var(--ease-standard), transform 120ms var(--ease-standard)",
                    opacity: a.live ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    if (!a.live) return;
                    e.currentTarget.style.borderColor = "var(--border-strong)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "var(--bg-sunken)",
              color: a.live ? "var(--accent)" : "var(--fg-subtle)",
            }}>
              <Icon name={a.icon} size={22} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 13, color: "var(--fg-muted)", whiteSpace: "pre-line", lineHeight: 1.4 }}>{a.desc}</div>
            </div>
            <div>
              {a.live ? <Pill>Open</Pill> : <Pill variant="neutral">soon</Pill>}
            </div>
          </button>
        ))}
        <div className="ad-card" style={{
          padding: 18, display: "flex", flexDirection: "column", gap: 14,
          borderStyle: "dashed", borderColor: "var(--border-strong)",
          background: "transparent",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "var(--bg-sunken)", color: "var(--fg-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="plus" size={20} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--fg)", marginBottom: 4 }}>More apps</div>
            <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>Coming soon to the dock.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountScreen({ onBack }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 120px" }}>
      <button className="ad-btn ad-btn-quiet ad-btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
        <Icon name="chevron-left" size={14} /> Back
      </button>
      <h1 className="ad-h1" style={{ marginBottom: 6 }}>Account</h1>
      <p className="ad-p" style={{ color: "var(--fg-muted)", marginBottom: 28 }}>
        One identity for every app on your dock.
      </p>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 99,
            background: "var(--accent-soft)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 500, fontSize: 20,
          }}>L</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Lou Beaumont</div>
            <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>lou@home.example</div>
          </div>
          <Button variant="ghost" size="sm">Edit</Button>
        </div>
      </Card>

      <div className="ad-eyebrow" style={{ marginTop: 24, marginBottom: 8 }}>Connected apps</div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {[
          { icon: "cookie",       name: "Breadly",  meta: "active · 3 recipes",   live: true },
          { icon: "calendar",     name: "Calendar", meta: "coming soon",          live: false },
          { icon: "notebook-pen", name: "Notes",    meta: "coming soon",          live: false },
        ].map((row, i, arr) => (
          <div key={row.name} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
            borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "var(--bg-sunken)", color: row.live ? "var(--accent)" : "var(--fg-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={row.icon} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{row.name}</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{row.meta}</div>
            </div>
            {row.live ? <Pill>connected</Pill> : <Pill variant="neutral">soon</Pill>}
          </div>
        ))}
      </Card>

      <div className="ad-eyebrow" style={{ marginTop: 24, marginBottom: 8 }}>Preferences</div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Appearance</div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Match the system theme.</div>
          </div>
          <Button variant="ghost" size="sm" icon="moon">Dark</Button>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { LoginScreen, LauncherScreen, AccountScreen });
