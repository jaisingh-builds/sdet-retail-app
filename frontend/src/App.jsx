const navItems = [
  { label: "Home", href: "/home", status: "Ready" },
  { label: "Login", href: "/login", status: "Day 2" },
  { label: "Products", href: "/products", status: "Week 1" },
  { label: "Cart", href: "/cart", status: "Week 1" },
  { label: "Orders", href: "/orders", status: "Week 2" }
];

const dayOneChecks = [
  "Validate browser title",
  "Validate current URL",
  "Assert visible heading",
  "Capture a full-page screenshot",
  "Discuss accessible page structure"
];

function App() {
  const currentPath = window.location.pathname === "/" ? "/home" : window.location.pathname;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <a className="brand" href="/home" aria-label="SDET Retail Automation Lab home">
          <span className="brand-mark" aria-hidden="true">SR</span>
          <span>
            <span className="brand-title">SDET Retail Automation Lab</span>
            <span className="brand-subtitle">UST Global training app</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={currentPath === item.href ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="page" id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">Day 1 launch target</p>
            <h1 id="page-title">SDET Retail Automation Lab</h1>
            <p className="lead">
              A controlled retail application for learning UI automation, API validation,
              service virtualisation, contract testing, and debugging.
            </p>
            <div className="hero-actions" aria-label="Primary actions">
              <a className="button primary" href="/home">Open home</a>
              <a className="button secondary" href="/products">Preview products</a>
            </div>
          </div>

          <div className="status-panel" aria-label="Application readiness summary">
            <div>
              <span className="status-label">Environment</span>
              <strong>Classroom local</strong>
            </div>
            <div>
              <span className="status-label">Frontend</span>
              <strong>ReactJS + Vite</strong>
            </div>
            <div>
              <span className="status-label">Day 1 state</span>
              <strong>Ready for launch validation</strong>
            </div>
          </div>
        </section>

        <section className="content-grid" aria-label="Day 1 training dashboard">
          <article className="panel">
            <h2>Automation Checks</h2>
            <ul className="check-list">
              {dayOneChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <h2>Application Modules</h2>
            <div className="module-list">
              {navItems.map((item) => (
                <a className="module-row" href={item.href} key={item.href}>
                  <span>{item.label}</span>
                  <span>{item.status}</span>
                </a>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
