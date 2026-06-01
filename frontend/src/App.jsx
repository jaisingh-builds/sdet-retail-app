import { useMemo, useState } from "react";

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

const testUsers = [
  {
    email: "customer@example.com",
    password: "Password@123",
    name: "Customer User",
    role: "Customer",
    locked: false
  },
  {
    email: "admin@example.com",
    password: "Password@123",
    name: "Admin User",
    role: "Admin",
    locked: false
  },
  {
    email: "user@test.com",
    password: "Secret123",
    name: "Demo User",
    role: "Customer",
    locked: false
  },
  {
    email: "locked@example.com",
    password: "Password@123",
    name: "Locked User",
    role: "Customer",
    locked: true
  }
];

function readStoredUser() {
  try {
    const stored = window.sessionStorage.getItem("sdet-retail-user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function App() {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname === "/" ? "/home" : window.location.pathname
  );
  const [currentUser, setCurrentUser] = useState(readStoredUser);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const login = ({ email, password }) => {
    const user = testUsers.find((candidate) => candidate.email === email);

    if (!user || user.password !== password || email === "invalid@example.com") {
      return { ok: false, message: "Invalid credentials. Check your email and password." };
    }

    if (user.locked) {
      return { ok: false, message: "Account is locked. Contact support." };
    }

    const safeUser = { email: user.email, name: user.name, role: user.role };
    window.sessionStorage.setItem("sdet-retail-user", JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    navigate("/home");
    return { ok: true };
  };

  const logout = () => {
    window.sessionStorage.removeItem("sdet-retail-user");
    setCurrentUser(null);
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <Header currentPath={currentPath} currentUser={currentUser} onNavigate={navigate} />

      <main className="page" id="main-content">
        {currentPath === "/login" ? (
          <LoginPage onLogin={login} />
        ) : (
          <HomePage currentUser={currentUser} onLogout={logout} />
        )}
      </main>
    </div>
  );
}

function Header({ currentPath, currentUser, onNavigate }) {
  return (
    <header className="top-bar">
      <a
        className="brand"
        href="/home"
        aria-label="SDET Retail Automation Lab home"
        onClick={(event) => {
          event.preventDefault();
          onNavigate("/home");
        }}
      >
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
            onClick={(event) => {
              event.preventDefault();
              onNavigate(item.href);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {currentUser ? (
        <div className="user-chip" aria-label="Signed in user">
          <span>{currentUser.name}</span>
        </div>
      ) : null}
    </header>
  );
}

function HomePage({ currentUser, onLogout }) {
  const dayState = currentUser ? `Signed in as ${currentUser.role}` : "Ready for launch validation";

  return (
    <>
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">{currentUser ? "Logged-in state" : "Day 1 launch target"}</p>
          <h1 id="page-title">
            {currentUser ? `Welcome, ${currentUser.name}` : "SDET Retail Automation Lab"}
          </h1>
          <p className="lead">
            A controlled retail application for learning UI automation, API validation,
            service virtualisation, contract testing, and debugging.
          </p>
          <div className="hero-actions" aria-label="Primary actions">
            {currentUser ? (
              <button className="button primary" type="button" onClick={onLogout}>
                Sign out
              </button>
            ) : (
              <a className="button primary" href="/login">Sign in</a>
            )}
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
            <span className="status-label">Day 2 state</span>
            <strong>{dayState}</strong>
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
    </>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [country, setCountry] = useState("India");
  const [error, setError] = useState("");

  const demoCredentials = useMemo(
    () => [
      { label: "Customer", value: "customer@example.com / Password@123" },
      { label: "Deck demo", value: "user@test.com / Secret123" },
      { label: "Locked", value: "locked@example.com / Password@123" }
    ],
    []
  );

  const submit = (event) => {
    event.preventDefault();
    setError("");
    const result = onLogin({ email, password, rememberMe, country });
    if (!result.ok) {
      setError(result.message);
    }
  };

  return (
    <section className="login-layout" aria-labelledby="login-title">
      <form className="login-form" aria-label="Login" onSubmit={submit}>
        <p className="eyebrow">Day 2 login workflow</p>
        <h1 id="login-title">Sign in to Retail Lab</h1>
        <p className="form-help">
          Use the classroom credentials to practice labels, roles, form inputs, and assertions.
        </p>

        {error ? (
          <div className="alert" role="alert" data-testid="login-error">
            {error}
          </div>
        ) : null}

        <label className="field" htmlFor="email">
          <span>Email</span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="customer@example.com"
            required
          />
        </label>

        <label className="field" htmlFor="password">
          <span>Password</span>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password@123"
            required
          />
        </label>

        <label className="field" htmlFor="country">
          <span>Country</span>
          <select id="country" value={country} onChange={(event) => setCountry(event.target.value)}>
            <option>India</option>
            <option>United States</option>
            <option>United Kingdom</option>
          </select>
        </label>

        <label className="checkbox-field" htmlFor="remember-me">
          <input
            id="remember-me"
            name="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>Remember me</span>
        </label>

        <button className="button primary form-submit" type="submit">
          Sign in
        </button>
      </form>

      <aside className="panel login-notes" aria-label="Classroom test users">
        <h2>Classroom Credentials</h2>
        <dl>
          {demoCredentials.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}

export default App;
