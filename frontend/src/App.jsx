import { useEffect, useMemo, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_POS_API_URL || "http://localhost:4000";

const navItems = [
  { label: "Home", href: "/home", status: "Ready" },
  { label: "Login", href: "/login", status: "Day 2" },
  { label: "Sync Lab", href: "/sync-lab", status: "Day 3" },
  { label: "Profile", href: "/profile", status: "Day 3" },
  { label: "Products", href: "/catalog", status: "Day 4" },
  { label: "Cart", href: "/cart", status: "Week 1" },
  { label: "Orders", href: "/orders", status: "Week 2" }
];

const featuredProduct = {
  name: "Running Shoes",
  slug: "running-shoes",
  price: "Rs. 4,499",
  summary: "Lightweight daily trainers with breathable mesh and steady heel support."
};

const promoFrameMarkup = `
<!doctype html>
<html lang="en">
  <head>
    <title>Retail promo signup</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; color: #172033; }
      form { display: grid; gap: 10px; padding: 14px; }
      label { display: grid; gap: 6px; font-weight: 700; }
      input { min-height: 36px; border: 1px solid #8f9bb0; border-radius: 4px; padding: 6px 8px; }
      button { width: fit-content; min-height: 36px; border: 0; border-radius: 4px; background: #125e6b; color: white; padding: 0 12px; font-weight: 700; }
      p { margin: 0; font-weight: 700; }
    </style>
  </head>
  <body>
    <form aria-label="Promo signup" onsubmit="event.preventDefault(); document.getElementById('promo-status').textContent='Thanks for subscribing';">
      <label>Email <input name="email" type="email" required /></label>
      <button type="submit">Subscribe</button>
      <p id="promo-status" role="status"></p>
    </form>
  </body>
</html>`;

const dayOneChecks = [
  "Validate browser title",
  "Validate current URL",
  "Assert visible heading",
  "Capture a full-page screenshot",
  "Discuss accessible page structure"
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
  const [cartCount, setCartCount] = useState(0);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  const login = async ({ email, password }) => {
    const response = await fetch(`${apiBaseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        ok: false,
        message: body.message || "Invalid credentials. Check your email and password."
      };
    }

    const body = await response.json();
    const safeUser = {
      email: body.user.email,
      name: body.user.name,
      role: body.user.role,
      token: body.token
    };
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
        ) : currentPath === "/sync-lab" ? (
          <SyncLabPage />
        ) : currentPath === "/profile" ? (
          <ProfilePage currentUser={currentUser} />
        ) : currentPath === "/catalog" || currentPath === "/products" ? (
          <CatalogPage onNavigate={navigate} />
        ) : currentPath === `/product/${featuredProduct.slug}` ? (
          <ProductPage
            onAddToCart={() => {
              setCartCount(1);
              navigate("/cart");
            }}
          />
        ) : currentPath === "/cart" ? (
          <CartPage cartCount={cartCount} onRemove={() => setCartCount(0)} />
        ) : currentPath === "/size-guide" ? (
          <SizeGuidePage />
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
            <a className="button secondary" href="/catalog">Preview products</a>
            <a className="button secondary" href="/sync-lab">Open sync lab</a>
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
            <span className="status-label">Day 3 state</span>
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

function CatalogPage({ onNavigate }) {
  return (
    <section className="catalog-layout" aria-labelledby="catalog-title">
      <div className="hero-copy">
        <p className="eyebrow">Day 4 navigation lab</p>
        <h1 id="catalog-title">Product Catalog</h1>
        <p className="lead">
          Practice page transitions by moving from catalog to product detail and then to cart.
        </p>
      </div>

      <article className="product-card">
        <div>
          <p className="eyebrow">Featured</p>
          <h2>{featuredProduct.name}</h2>
          <p>{featuredProduct.summary}</p>
          <strong>{featuredProduct.price}</strong>
        </div>
        <a
          className="button primary"
          href={`/product/${featuredProduct.slug}`}
          onClick={(event) => {
            event.preventDefault();
            onNavigate(`/product/${featuredProduct.slug}`);
          }}
        >
          View details
        </a>
      </article>
    </section>
  );
}

function ProductPage({ onAddToCart }) {
  const [size, setSize] = useState("UK 8");

  return (
    <section className="product-layout" aria-labelledby="product-title">
      <div className="product-detail">
        <p className="eyebrow">Product detail</p>
        <h1 id="product-title">{featuredProduct.name}</h1>
        <p className="lead">{featuredProduct.summary}</p>
        <p className="price">{featuredProduct.price}</p>

        <label className="field" htmlFor="shoe-size">
          <span>Size</span>
          <select id="shoe-size" value={size} onChange={(event) => setSize(event.target.value)}>
            <option>UK 7</option>
            <option>UK 8</option>
            <option>UK 9</option>
            <option>UK 10</option>
          </select>
        </label>

        <div className="product-actions">
          <button className="button primary" type="button" onClick={onAddToCart}>
            Add to cart
          </button>
          <a className="button secondary" href="/size-guide" target="_blank" rel="noreferrer">
            Size guide
          </a>
        </div>

        <p className="inline-status" role="status">
          Selected size: {size}
        </p>
      </div>

      <section className="panel" aria-labelledby="promo-title">
        <h2 id="promo-title">Promo Signup</h2>
        <iframe
          className="promo-frame"
          title="Promo signup frame"
          srcDoc={promoFrameMarkup}
        />
      </section>
    </section>
  );
}

function CartPage({ cartCount, onRemove }) {
  const removeItem = () => {
    if (window.confirm("Remove Running Shoes from cart?")) {
      onRemove();
    }
  };

  return (
    <section className="cart-layout" aria-labelledby="cart-title">
      <div className="hero-copy">
        <p className="eyebrow">Dialog validation lab</p>
        <h1 id="cart-title">Cart</h1>
        <p>
          Cart count: <strong data-testid="cart-count">{cartCount}</strong>
        </p>

        {cartCount > 0 ? (
          <div className="cart-row">
            <span>{featuredProduct.name}</span>
            <span>{featuredProduct.price}</span>
            <button className="button secondary" type="button" onClick={removeItem}>
              Remove
            </button>
          </div>
        ) : (
          <p role="status">Your cart is empty.</p>
        )}
      </div>
    </section>
  );
}

function SizeGuidePage() {
  return (
    <section className="hero" aria-labelledby="size-guide-title">
      <div className="hero-copy">
        <p className="eyebrow">New tab target</p>
        <h1 id="size-guide-title">Size Guide</h1>
        <table>
          <caption>Shoe size conversion</caption>
          <thead>
            <tr>
              <th>UK</th>
              <th>EU</th>
              <th>Foot length</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>UK 8</td>
              <td>EU 42</td>
              <td>26.5 cm</td>
            </tr>
            <tr>
              <td>UK 9</td>
              <td>EU 43</td>
              <td>27.3 cm</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [country, setCountry] = useState("India");
  const [error, setError] = useState("");
  const [isSignInReady, setIsSignInReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSignInReady(false);
    const timer = window.setTimeout(() => setIsSignInReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const demoCredentials = useMemo(
    () => [
      { label: "Customer", value: "customer@example.com / Password@123" },
      { label: "Deck demo", value: "user@test.com / Secret123" },
      { label: "Locked", value: "locked@example.com / Password@123" }
    ],
    []
  );

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await onLogin({ email, password, rememberMe, country });
      if (!result.ok) {
        setError(result.message);
      }
    } catch {
      setError("Login service is unavailable. Try again after the API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-layout" aria-labelledby="login-title">
      <form className="login-form" aria-label="Login" onSubmit={submit}>
        <p className="eyebrow">Day 3 delayed button enabled</p>
        <h1 id="login-title">Sign in to Retail Lab</h1>
        <p className="form-help">
          Use the classroom credentials to practice labels, roles, form inputs, assertions, and
          synchronization.
        </p>

        {!isSignInReady ? (
          <p className="inline-status" role="status">Preparing secure sign-in...</p>
        ) : null}

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

        <button
          className="button primary form-submit"
          type="submit"
          disabled={!isSignInReady || isSubmitting}
        >
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

function SyncLabPage() {
  const [status, setStatus] = useState("idle");
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState("0");

  const loadProducts = async () => {
    setStatus("loading");
    setProducts([]);
    setCartCount("0");
    const response = await fetch(`${apiBaseUrl}/api/products?delay=900`);
    const body = await response.json();
    setProducts(body.items);
    setCartCount("3");
    setStatus("loaded");
  };

  return (
    <section className="sync-layout" aria-labelledby="sync-title">
      <div className="hero-copy">
        <p className="eyebrow">Day 3 synchronization lab</p>
        <h1 id="sync-title">Dynamic Retail Data</h1>
        <p className="lead">
          Click Load to trigger a delayed API request. Use assertions for the spinner, table, and
          cart count instead of fixed sleeps.
        </p>
        <button className="button primary" type="button" onClick={loadProducts}>
          Load
        </button>
      </div>

      <div className="panel">
        <h2>Loaded Products</h2>
        <p>
          Cart count: <strong data-testid="cart-count">{cartCount}</strong>
        </p>
        {status === "loading" ? (
          <div className="spinner" data-testid="spinner" role="status">
            Loading products...
          </div>
        ) : null}
        {status === "loaded" ? (
          <table>
            <caption>Retail product results</caption>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}

function ProfilePage({ currentUser }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!currentUser?.token) {
        setError("Sign in before loading the profile.");
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });

      if (!response.ok) {
        setError("Profile could not be loaded.");
        return;
      }

      const body = await response.json();
      if (!cancelled) {
        setProfile(body);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <section className="hero" aria-labelledby="profile-title">
      <div className="hero-copy">
        <p className="eyebrow">Network wait target</p>
        <h1 id="profile-title">Profile</h1>
        {error ? <div className="alert" role="alert">{error}</div> : null}
        {!error && !profile ? (
          <div className="spinner" data-testid="profile-spinner" role="status">
            Loading profile...
          </div>
        ) : null}
        {profile ? (
          <dl className="profile-list">
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile.role}</dd>
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}

export default App;
