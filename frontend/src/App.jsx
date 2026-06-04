import { useEffect, useMemo, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_POS_API_URL || "http://localhost:4000";

const navItems = [
  { label: "Home", href: "/home", status: "Ready" },
  { label: "Login", href: "/login", status: "Day 2" },
  { label: "Sync Lab", href: "/sync-lab", status: "Day 3" },
  { label: "Profile", href: "/profile", status: "Day 3" },
  { label: "Products", href: "/catalog", status: "Day 4" },
  { label: "Frames", href: "/frames-lab", status: "Day 4" },
  { label: "A11y Lab", href: "/a11y-lab", status: "Day 4" },
  { label: "Cart", href: "/cart", status: "Week 1" },
  { label: "Checkout", href: "/checkout", status: "Week 4" },
  { label: "Orders", href: "/orders", status: "Week 2" },
  { label: "Admin", href: "/admin/products", status: "Week 5" }
];

const products = [
  {
    name: "Running Shoes",
    slug: "running-shoes",
    category: "Footwear",
    price: 4499,
    rating: 4.7,
    stock: 18,
    colors: ["Navy", "Black", "White"],
    sizes: ["UK 7", "UK 8", "UK 9", "UK 10"],
    summary: "Lightweight daily trainers with breathable mesh and steady heel support.",
    delivery: "Ships tomorrow"
  },
  {
    name: "Travel Backpack",
    slug: "travel-backpack",
    category: "Bags",
    price: 3299,
    rating: 4.5,
    stock: 11,
    colors: ["Forest", "Graphite"],
    sizes: ["20 L", "30 L", "40 L"],
    summary: "Cabin-friendly backpack with laptop storage, rain cover, and quick-access pockets.",
    delivery: "Ships in 2 days"
  },
  {
    name: "Noise Canceling Headphones",
    slug: "noise-canceling-headphones",
    category: "Electronics",
    price: 7999,
    rating: 4.8,
    stock: 7,
    colors: ["Black", "Silver"],
    sizes: ["Standard"],
    summary: "Wireless over-ear headphones with long battery life and commute-ready ANC.",
    delivery: "Limited stock"
  },
  {
    name: "Insulated Water Bottle",
    slug: "insulated-water-bottle",
    category: "Fitness",
    price: 999,
    rating: 4.3,
    stock: 42,
    colors: ["Blue", "Steel", "Green"],
    sizes: ["750 ml", "1 L"],
    summary: "Leak-proof bottle that keeps drinks cold through long office and training days.",
    delivery: "Same-day pickup"
  },
  {
    name: "Yoga Mat",
    slug: "yoga-mat",
    category: "Fitness",
    price: 1499,
    rating: 4.4,
    stock: 23,
    colors: ["Teal", "Purple"],
    sizes: ["6 mm", "8 mm"],
    summary: "Non-slip mat with firm cushioning for daily stretching and workout routines.",
    delivery: "Ships tomorrow"
  },
  {
    name: "Rain Jacket",
    slug: "rain-jacket",
    category: "Apparel",
    price: 2799,
    rating: 4.2,
    stock: 9,
    colors: ["Yellow", "Olive", "Black"],
    sizes: ["S", "M", "L", "XL"],
    summary: "Packable waterproof jacket with taped seams and adjustable hood.",
    delivery: "Ships in 2 days"
  }
];

const orders = [
  {
    id: "ORD-1007",
    placedOn: "2026-06-03",
    status: "Ready for dispatch",
    payment: "Paid",
    total: 9197,
    items: ["Running Shoes", "Express shipping"],
    channel: "Web"
  },
  {
    id: "ORD-1006",
    placedOn: "2026-06-01",
    status: "Delivered",
    payment: "Paid",
    total: 4298,
    items: ["Travel Backpack", "Insulated Water Bottle"],
    channel: "Store pickup"
  },
  {
    id: "ORD-1005",
    placedOn: "2026-05-29",
    status: "Return requested",
    payment: "Refund pending",
    total: 2799,
    items: ["Rain Jacket"],
    channel: "Web"
  }
];

function formatPrice(amount) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function findProduct(slug) {
  return products.find((product) => product.slug === slug) || products[0];
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

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

const shippingFrameMarkup = `
<!doctype html>
<html lang="en">
  <head>
    <title>Shipping estimate widget</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; color: #172033; background: #ffffff; }
      main { display: grid; gap: 14px; padding: 18px; }
      h1 { margin: 0; font-size: 1.25rem; }
      p { margin: 0; color: #40506a; line-height: 1.5; }
      form { display: grid; gap: 12px; }
      label { display: grid; gap: 6px; font-weight: 700; }
      input, select { min-height: 38px; border: 1px solid #8f9bb0; border-radius: 4px; padding: 6px 8px; font: inherit; }
      button { width: fit-content; min-height: 38px; border: 0; border-radius: 4px; background: #125e6b; color: white; padding: 0 14px; font-weight: 700; }
      [role="status"] { min-height: 22px; font-weight: 700; color: #0f5360; }
    </style>
  </head>
  <body>
    <main>
      <h1>Shipping Partner Widget</h1>
      <p>This content is isolated inside an iframe to practice frame-specific locators.</p>
      <form aria-label="Shipping estimate" onsubmit="event.preventDefault(); document.getElementById('estimate-status').textContent='Estimate ready: delivery by Friday';">
        <label>Order ID <input name="orderId" value="ORD-1007" required /></label>
        <label>Destination
          <select name="destination">
            <option>Bengaluru</option>
            <option>Chennai</option>
            <option>Hyderabad</option>
          </select>
        </label>
        <button type="submit">Get estimate</button>
        <p id="estimate-status" role="status"></p>
      </form>
    </main>
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
  const [cartItems, setCartItems] = useState([]);
  const [createdOrders, setCreatedOrders] = useState([]);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const allOrders = [...createdOrders, ...orders];

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  useEffect(() => {
    const syncPathFromBrowserHistory = () => {
      setCurrentPath(window.location.pathname === "/" ? "/home" : window.location.pathname);
    };

    window.addEventListener("popstate", syncPathFromBrowserHistory);
    return () => window.removeEventListener("popstate", syncPathFromBrowserHistory);
  }, []);

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
        ) : currentPath === "/frames-lab" ? (
          <FramesLabPage />
        ) : currentPath === "/a11y-lab" ? (
          <AccessibilityLabPage />
        ) : currentPath.startsWith("/product/") ? (
          <ProductPage
            product={findProduct(currentPath.replace("/product/", ""))}
            onAddToCart={(item) => {
              setCartItems((existingItems) => {
                const existingItem = existingItems.find(
                  (cartItem) =>
                    cartItem.slug === item.slug &&
                    cartItem.size === item.size &&
                    cartItem.color === item.color
                );

                if (!existingItem) {
                  return [...existingItems, item];
                }

                return existingItems.map((cartItem) =>
                  cartItem === existingItem
                    ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                    : cartItem
                );
              });
              navigate("/cart");
            }}
          />
        ) : currentPath === "/cart" ? (
          <CartPage
            cartCount={cartCount}
            items={cartItems}
            onNavigate={navigate}
            onRemove={(slug) =>
              setCartItems((existingItems) => existingItems.filter((item) => item.slug !== slug))
            }
          />
        ) : currentPath === "/checkout" ? (
          <CheckoutPage
            currentUser={currentUser}
            items={cartItems}
            onNavigate={navigate}
            onPlaceOrder={(order) => {
              setCreatedOrders((existingOrders) => [order, ...existingOrders]);
              setCartItems([]);
            }}
          />
        ) : currentPath === "/size-guide" ? (
          <SizeGuidePage />
        ) : currentPath === "/orders" ? (
          <OrdersPage ordersList={allOrders} />
        ) : currentPath === "/admin/products" ? (
          <AdminProductsPage />
        ) : currentPath === "/admin/orders" ? (
          <AdminOrdersPage ordersList={allOrders} />
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
  const [category, setCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recommended");
  const categories = ["All", ...new Set(products.map((product) => product.category))];

  const visibleProducts = products
    .filter((product) => category === "All" || product.category === category)
    .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((first, second) => {
      if (sortBy === "Price: low to high") {
        return first.price - second.price;
      }
      if (sortBy === "Rating") {
        return second.rating - first.rating;
      }
      return products.indexOf(first) - products.indexOf(second);
    });
  const resultLabel = visibleProducts.length === 1 ? "product" : "products";

  return (
    <section className="catalog-page" aria-labelledby="catalog-title">
      <div className="hero-copy">
        <p className="eyebrow">Day 4 navigation lab</p>
        <h1 id="catalog-title">Product Catalog</h1>
        <p className="lead">
          Practice realistic retail navigation with filters, sorting, product cards, and page
          transition assertions.
        </p>
      </div>

      <form className="catalog-filters" aria-label="Product filters">
        <label className="field" htmlFor="search-products">
          <span>Search products</span>
          <input
            id="search-products"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by product name"
          />
        </label>

        <label className="field" htmlFor="category-filter">
          <span>Category</span>
          <select
            id="category-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor="sort-products">
          <span>Sort by</span>
          <select id="sort-products" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option>Recommended</option>
            <option>Price: low to high</option>
            <option>Rating</option>
          </select>
        </label>
      </form>

      <p className="inline-status" role="status" data-testid="catalog-result-count">
        Showing {visibleProducts.length} {resultLabel}
      </p>

      <div className="product-grid" aria-label="Product results">
        {visibleProducts.map((product) => (
          <article className="product-card" aria-label={product.name} key={product.slug}>
            <div>
              <p className="eyebrow">{product.category}</p>
              <h2>{product.name}</h2>
              <p>{product.summary}</p>
              <dl className="product-meta">
                <div>
                  <dt>Price</dt>
                  <dd>{formatPrice(product.price)}</dd>
                </div>
                <div>
                  <dt>Rating</dt>
                  <dd>{product.rating}</dd>
                </div>
                <div>
                  <dt>Stock</dt>
                  <dd>{product.stock}</dd>
                </div>
              </dl>
            </div>
            <a
              className="button primary"
              href={`/product/${product.slug}`}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(`/product/${product.slug}`);
              }}
            >
              View {product.name}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function FramesLabPage() {
  return (
    <section className="frames-page" aria-labelledby="frames-title">
      <div className="hero-copy">
        <p className="eyebrow">Day 4 iframe lab</p>
        <h1 id="frames-title">Frames Lab</h1>
        <p className="lead">
          Practice switching from the main page into an embedded shipping partner widget. The
          controls below are not in the parent document.
        </p>
      </div>

      <div className="frame-lab-layout">
        <section className="panel" aria-labelledby="parent-context-title">
          <h2 id="parent-context-title">Parent Page Context</h2>
          <dl className="product-meta">
            <div>
              <dt>Order</dt>
              <dd>ORD-1007</dd>
            </div>
            <div>
              <dt>Carrier</dt>
              <dd>UST Express</dd>
            </div>
            <div>
              <dt>Widget source</dt>
              <dd>Embedded iframe</dd>
            </div>
          </dl>
          <p>
            Parent-page locators cannot directly see the form fields inside the frame. Use
            `frameLocator()` for the shipping estimate form.
          </p>
        </section>

        <section className="panel" aria-labelledby="shipping-frame-title">
          <h2 id="shipping-frame-title">Embedded Shipping Widget</h2>
          <iframe
            className="exercise-frame"
            title="Shipping estimate frame"
            srcDoc={shippingFrameMarkup}
          />
        </section>
      </div>
    </section>
  );
}

function AccessibilityLabPage() {
  return (
    <section className="a11y-lab-page" aria-labelledby="a11y-lab-title">
      <div className="hero-copy">
        <p className="eyebrow">Day 4 accessibility lab</p>
        <h1 id="a11y-lab-title">A11y Lab</h1>
        <p className="lead">
          This page intentionally includes accessibility defects so trainees can run Axe, inspect
          rule IDs, and trace a violation back to the DOM.
        </p>
      </div>

      <div className="a11y-lab-layout">
        <section className="panel" aria-labelledby="broken-widget-title">
          <h2 id="broken-widget-title">Broken Support Widget</h2>
          <p>
            The ticket input below has no accessible label. The image also has no alternative text.
          </p>
          <div className="broken-support-card">
            <img
              className="support-preview"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='120'%3E%3Crect width='240' height='120' fill='%23dbeafe'/%3E%3Ccircle cx='64' cy='58' r='24' fill='%23125e6b'/%3E%3Crect x='104' y='42' width='92' height='16' fill='%23172033'/%3E%3Crect x='104' y='68' width='64' height='12' fill='%2340506a'/%3E%3C/svg%3E"
            />
            <input id="support-ticket" placeholder="Enter support ticket ID" />
            <button className="icon-only-broken-button" type="button"></button>
            <button className="button primary" type="button">
              Lookup ticket
            </button>
          </div>
        </section>

        <section className="panel" aria-labelledby="a11y-backtrack-title">
          <h2 id="a11y-backtrack-title">Backtracking Clues</h2>
          <dl className="product-meta">
            <div>
              <dt>Expected Axe rule</dt>
              <dd>button-name</dd>
            </div>
            <div>
              <dt>Likely target</dt>
              <dd>.icon-only-broken-button</dd>
            </div>
            <div>
              <dt>Expected Axe rule</dt>
              <dd>image-alt</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}

function ProductPage({ product, onAddToCart }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [fulfilment, setFulfilment] = useState("Home delivery");
  const relatedProducts = products
    .filter((item) => item.category === product.category && item.slug !== product.slug)
    .slice(0, 2);

  return (
    <section className="product-layout" aria-labelledby="product-title">
      <div className="product-detail">
        <p className="eyebrow">{product.category}</p>
        <h1 id="product-title">{product.name}</h1>
        <p className="lead">{product.summary}</p>
        <p className="price">{formatPrice(product.price)}</p>

        <dl className="product-meta">
          <div>
            <dt>Rating</dt>
            <dd>{product.rating} out of 5</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{product.stock} in stock</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{product.delivery}</dd>
          </div>
        </dl>

        <label className="field" htmlFor="shoe-size">
          <span>Size</span>
          <select id="shoe-size" value={size} onChange={(event) => setSize(event.target.value)}>
            {product.sizes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <fieldset className="option-group">
          <legend>Color</legend>
          {product.colors.map((item) => (
            <label key={item}>
              <input
                checked={color === item}
                name="color"
                type="radio"
                value={item}
                onChange={(event) => setColor(event.target.value)}
              />
              <span>{item}</span>
            </label>
          ))}
        </fieldset>

        <label className="field" htmlFor="quantity">
          <span>Quantity</span>
          <input
            id="quantity"
            min="1"
            max="5"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>

        <fieldset className="option-group">
          <legend>Fulfilment</legend>
          {["Home delivery", "Store pickup"].map((item) => (
            <label key={item}>
              <input
                checked={fulfilment === item}
                name="fulfilment"
                type="radio"
                value={item}
                onChange={(event) => setFulfilment(event.target.value)}
              />
              <span>{item}</span>
            </label>
          ))}
        </fieldset>

        <div className="product-actions">
          <button
            className="button primary"
            type="button"
            onClick={() =>
              onAddToCart({
                slug: product.slug,
                name: product.name,
                price: product.price,
                size,
                color,
                quantity,
                fulfilment
              })
            }
          >
            Add to cart
          </button>
          <a className="button secondary" href="/size-guide" target="_blank" rel="noreferrer">
            Size guide
          </a>
        </div>

        <p className="inline-status" role="status">
          Selected {product.name}: {color}, {size}, quantity {quantity}, {fulfilment}
        </p>
      </div>

      <div className="side-stack">
        <section className="panel" aria-labelledby="promo-title">
          <h2 id="promo-title">Promo Signup</h2>
          <iframe
            className="promo-frame"
            title="Promo signup frame"
            srcDoc={promoFrameMarkup}
          />
        </section>

        <section className="panel" aria-labelledby="related-title">
          <h2 id="related-title">Related Products</h2>
          {relatedProducts.length ? (
            <ul className="related-list">
              {relatedProducts.map((item) => (
                <li key={item.slug}>
                  <a href={`/product/${item.slug}`}>{item.name}</a>
                  <span>{formatPrice(item.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No related products in this category.</p>
          )}
        </section>
      </div>
    </section>
  );
}

function CartPage({ cartCount, items, onNavigate, onRemove }) {
  const [shippingMethod, setShippingMethod] = useState("Standard shipping");
  const shippingCost = shippingMethod === "Express shipping" && items.length ? 199 : 0;
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const removeItem = (item) => {
    if (window.confirm(`Remove ${item.name} from cart?`)) {
      onRemove(item.slug);
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

        {items.length > 0 ? (
          <>
            <div className="cart-items" aria-label="Cart items">
              {items.map((item) => (
                <div className="cart-row" key={`${item.slug}-${item.size}-${item.color}`}>
                  <span>{item.name}</span>
                  <span>{item.color}</span>
                  <span>{item.size}</span>
                  <span>Qty {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                  <button className="button secondary" type="button" onClick={() => removeItem(item)}>
                    Remove {item.name}
                  </button>
                </div>
              ))}
            </div>

            <label className="field" htmlFor="shipping-method">
              <span>Shipping method</span>
              <select
                id="shipping-method"
                value={shippingMethod}
                onChange={(event) => setShippingMethod(event.target.value)}
              >
                <option>Standard shipping</option>
                <option>Express shipping</option>
              </select>
            </label>

            <dl className="order-summary" aria-label="Order summary">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{shippingCost ? formatPrice(shippingCost) : "Free"}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd data-testid="order-total">{formatPrice(subtotal + shippingCost)}</dd>
              </div>
            </dl>

            <button className="button primary" type="button" onClick={() => onNavigate("/checkout")}>
              Proceed to checkout
            </button>
          </>
        ) : (
          <>
            <p role="status">Your cart is empty.</p>
            <button className="button secondary" type="button" onClick={() => onNavigate("/catalog")}>
              Continue shopping
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function CheckoutPage({ currentUser, items, onNavigate, onPlaceOrder }) {
  const [paymentMethod, setPaymentMethod] = useState("Credit card");
  const [deliverySlot, setDeliverySlot] = useState("Tomorrow 9 AM - 12 PM");
  const [address, setAddress] = useState("UST Campus, Bengaluru");
  const [coupon, setCoupon] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = items.length ? 199 : 0;
  const discount = coupon.trim().toUpperCase() === "UST10" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shipping - discount;

  const placeOrder = (event) => {
    event.preventDefault();
    const order = {
      id: `ORD-${1008 + items.length}`,
      placedOn: "2026-06-04",
      status: paymentMethod === "Cash on delivery" ? "Payment pending" : "Confirmed",
      payment: paymentMethod === "Cash on delivery" ? "Pending" : "Paid",
      total,
      items: items.map((item) => item.name),
      channel: "Web"
    };
    onPlaceOrder(order);
    setConfirmation(order);
  };

  return (
    <section className="checkout-page" aria-labelledby="checkout-title">
      <div className="hero-copy">
        <p className="eyebrow">Capstone checkout slice</p>
        <h1 id="checkout-title">Checkout</h1>
        <p className="lead">
          Validate address, delivery slot, payment mode, coupon behavior, and final order
          confirmation.
        </p>
      </div>

      {confirmation ? (
        <section className="confirmation-panel" aria-labelledby="confirmation-title">
          <p className="eyebrow">Order created</p>
          <h2 id="confirmation-title">Thank you for your order</h2>
          <p>
            Order <strong>{confirmation.id}</strong> is {confirmation.status.toLowerCase()}.
          </p>
          <button className="button primary" type="button" onClick={() => onNavigate("/orders")}>
            View orders
          </button>
        </section>
      ) : null}

      {!confirmation && items.length === 0 ? (
        <section className="panel" aria-labelledby="empty-checkout-title">
          <h2 id="empty-checkout-title">No items to checkout</h2>
          <p role="status">Add a product to cart before placing an order.</p>
          <button className="button secondary" type="button" onClick={() => onNavigate("/catalog")}>
            Browse products
          </button>
        </section>
      ) : null}

      {!confirmation && items.length > 0 ? (
        <form className="checkout-layout" aria-label="Checkout" onSubmit={placeOrder}>
          <section className="panel" aria-labelledby="delivery-title">
            <h2 id="delivery-title">Delivery Details</h2>
            <label className="field" htmlFor="checkout-email">
              <span>Email</span>
              <input
                id="checkout-email"
                type="email"
                value={currentUser?.email || "customer@example.com"}
                readOnly
              />
            </label>
            <label className="field" htmlFor="delivery-address">
              <span>Delivery address</span>
              <textarea
                id="delivery-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
              />
            </label>
            <label className="field" htmlFor="delivery-slot">
              <span>Delivery slot</span>
              <select
                id="delivery-slot"
                value={deliverySlot}
                onChange={(event) => setDeliverySlot(event.target.value)}
              >
                <option>Tomorrow 9 AM - 12 PM</option>
                <option>Tomorrow 2 PM - 5 PM</option>
                <option>Weekend priority delivery</option>
              </select>
            </label>
            <label className="field" htmlFor="payment-method">
              <span>Payment method</span>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option>Credit card</option>
                <option>UPI</option>
                <option>Cash on delivery</option>
              </select>
            </label>
          </section>

          <section className="panel" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title">Checkout Summary</h2>
            <div className="cart-items" aria-label="Checkout items">
              {items.map((item) => (
                <div className="summary-row" key={`${item.slug}-${item.size}-${item.color}`}>
                  <span>{item.name}</span>
                  <span>Qty {item.quantity}</span>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <label className="field" htmlFor="coupon-code">
              <span>Coupon code</span>
              <input
                id="coupon-code"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="Try UST10"
              />
            </label>
            <dl className="order-summary" aria-label="Checkout totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{formatPrice(shipping)}</dd>
              </div>
              <div>
                <dt>Discount</dt>
                <dd>{discount ? `-${formatPrice(discount)}` : "None"}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd data-testid="checkout-total">{formatPrice(total)}</dd>
              </div>
            </dl>
            <button className="button primary" type="submit">
              Place order
            </button>
          </section>
        </form>
      ) : null}
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

function OrdersPage({ ordersList }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const visibleOrders =
    statusFilter === "All" ? ordersList : ordersList.filter((order) => order.status === statusFilter);
  const totalOrderValue = visibleOrders.reduce((total, order) => total + order.total, 0);
  const statusOptions = ["All", ...new Set(ordersList.map((order) => order.status))];

  return (
    <section className="orders-page" aria-labelledby="orders-title">
      <div className="hero-copy">
        <p className="eyebrow">Week 2 API-ready module</p>
        <h1 id="orders-title">Orders</h1>
        <p className="lead">
          Review order history, payment state, fulfilment status, and line-item evidence for
          end-to-end retail scenarios.
        </p>
      </div>

      <section className="orders-summary" aria-label="Orders summary">
        <div>
          <span className="status-label">Visible orders</span>
          <strong data-testid="orders-count">{visibleOrders.length}</strong>
        </div>
        <div>
          <span className="status-label">Order value</span>
          <strong>{formatPrice(totalOrderValue)}</strong>
        </div>
        <label className="field" htmlFor="order-status-filter">
          <span>Order status</span>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="panel">
        <table>
          <caption>Recent retail orders</caption>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Channel</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.id}</strong>
                  <span className="table-note">{order.items.join(", ")}</span>
                </td>
                <td>{order.placedOn}</td>
                <td>{order.status}</td>
                <td>{order.payment}</td>
                <td>{order.channel}</td>
                <td>{formatPrice(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminProductsPage() {
  const [adminProducts, setAdminProducts] = useState(products);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Accessories",
    price: "1999",
    stock: "10",
    featured: false
  });
  const [message, setMessage] = useState("");
  const categories = ["All", ...new Set(adminProducts.map((product) => product.category))];
  const visibleProducts =
    categoryFilter === "All"
      ? adminProducts
      : adminProducts.filter((product) => product.category === categoryFilter);

  const addProduct = (event) => {
    event.preventDefault();
    const product = {
      name: newProduct.name,
      slug: slugify(newProduct.name),
      category: newProduct.category,
      price: Number(newProduct.price),
      rating: 4,
      stock: Number(newProduct.stock),
      colors: ["Black"],
      sizes: ["Standard"],
      summary: `${newProduct.name} added through the admin product workflow.`,
      delivery: newProduct.featured ? "Priority launch item" : "Ships in 2 days"
    };
    setAdminProducts((existingProducts) => [product, ...existingProducts]);
    setNewProduct({ name: "", category: "Accessories", price: "1999", stock: "10", featured: false });
    setMessage(`${product.name} created`);
  };

  return (
    <section className="admin-page" aria-labelledby="admin-products-title">
      <div className="hero-copy">
        <p className="eyebrow">Admin workflow</p>
        <h1 id="admin-products-title">Admin Products</h1>
        <p className="lead">
          Manage product data, validate filters, and practice create-flow assertions with stable
          classroom data.
        </p>
      </div>

      <div className="admin-layout">
        <form className="panel" aria-label="Create product" onSubmit={addProduct}>
          <h2>Create Product</h2>
          {message ? <p className="inline-status" role="status">{message}</p> : null}
          <label className="field" htmlFor="new-product-name">
            <span>Product name</span>
            <input
              id="new-product-name"
              value={newProduct.name}
              onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })}
              required
            />
          </label>
          <label className="field" htmlFor="new-product-category">
            <span>Category</span>
            <select
              id="new-product-category"
              value={newProduct.category}
              onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value })}
            >
              <option>Accessories</option>
              <option>Apparel</option>
              <option>Electronics</option>
              <option>Fitness</option>
            </select>
          </label>
          <div className="form-grid">
            <label className="field" htmlFor="new-product-price">
              <span>Price</span>
              <input
                id="new-product-price"
                min="1"
                type="number"
                value={newProduct.price}
                onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })}
              />
            </label>
            <label className="field" htmlFor="new-product-stock">
              <span>Stock</span>
              <input
                id="new-product-stock"
                min="0"
                type="number"
                value={newProduct.stock}
                onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })}
              />
            </label>
          </div>
          <label className="checkbox-field" htmlFor="featured-product">
            <input
              id="featured-product"
              type="checkbox"
              checked={newProduct.featured}
              onChange={(event) => setNewProduct({ ...newProduct, featured: event.target.checked })}
            />
            <span>Featured launch item</span>
          </label>
          <button className="button primary" type="submit">
            Save product
          </button>
        </form>

        <section className="panel" aria-labelledby="product-inventory-title">
          <h2 id="product-inventory-title">Product Inventory</h2>
          <label className="field" htmlFor="admin-category-filter">
            <span>Category filter</span>
            <select
              id="admin-category-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <p className="inline-status" role="status" data-testid="admin-product-count">
            Showing {visibleProducts.length} products
          </p>
          <table>
            <caption>Admin product inventory</caption>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.slug}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}

function AdminOrdersPage({ ordersList }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [channelFilter, setChannelFilter] = useState("All");
  const visibleOrders = ordersList
    .filter((order) => statusFilter === "All" || order.status === statusFilter)
    .filter((order) => channelFilter === "All" || order.channel === channelFilter);
  const statuses = ["All", ...new Set(ordersList.map((order) => order.status))];
  const channels = ["All", ...new Set(ordersList.map((order) => order.channel))];

  return (
    <section className="admin-page" aria-labelledby="admin-orders-title">
      <div className="hero-copy">
        <p className="eyebrow">Admin workflow</p>
        <h1 id="admin-orders-title">Admin Orders</h1>
        <p className="lead">
          Review fulfilment queues, payment states, and channel filters for role-based admin tests.
        </p>
      </div>

      <div className="orders-summary" aria-label="Admin order filters">
        <div>
          <span className="status-label">Visible orders</span>
          <strong data-testid="admin-orders-count">{visibleOrders.length}</strong>
        </div>
        <label className="field" htmlFor="admin-order-status">
          <span>Status</span>
          <select
            id="admin-order-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="admin-order-channel">
          <span>Channel</span>
          <select
            id="admin-order-channel"
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value)}
          >
            {channels.map((channel) => (
              <option key={channel}>{channel}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="panel" aria-labelledby="admin-orders-table-title">
        <h2 id="admin-orders-table-title">Fulfilment Queue</h2>
        <table>
          <caption>Admin order queue</caption>
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Channel</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.status}</td>
                <td>{order.payment}</td>
                <td>{order.channel}</td>
                <td>{formatPrice(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
  const [draftProfile, setDraftProfile] = useState({
    name: "",
    phone: "",
    address: "",
    marketingOptIn: true
  });
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [fileName, setFileName] = useState("");

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
        const enrichedProfile = {
          ...body,
          phone: "+91 98765 43210",
          address: "UST Campus, Bengaluru",
          marketingOptIn: true
        };
        setProfile(enrichedProfile);
        setDraftProfile(enrichedProfile);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <div className="hero-copy">
        <p className="eyebrow">Network wait target</p>
        <h1 id="profile-title">Profile</h1>
        <p className="lead">
          Practice authenticated data loading, editable form fields, validation, and file upload
          locators.
        </p>
        {error ? <div className="alert" role="alert">{error}</div> : null}
        {!error && !profile ? (
          <div className="spinner" data-testid="profile-spinner" role="status">
            Loading profile...
          </div>
        ) : null}
      </div>

      {profile ? (
        <form
          className="profile-form panel"
          aria-label="Profile details"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draftProfile.name.trim()) {
              setSaveMessage("Name is required.");
              return;
            }
            setProfile(draftProfile);
            setSaveMessage("Profile saved.");
          }}
        >
          <p className="table-note">Signed in email: {profile.email}</p>
          {saveMessage ? <p className="inline-status" role="status">{saveMessage}</p> : null}
          <div className="form-grid">
            <label className="field" htmlFor="profile-name">
              <span>Name</span>
              <input
                id="profile-name"
                value={draftProfile.name}
                onChange={(event) => setDraftProfile({ ...draftProfile, name: event.target.value })}
                required
              />
            </label>
            <label className="field" htmlFor="profile-email">
              <span>Email</span>
              <input id="profile-email" type="email" value={profile.email} readOnly />
            </label>
          </div>
          <div className="form-grid">
            <label className="field" htmlFor="profile-role">
              <span>Role</span>
              <input id="profile-role" value={profile.role} readOnly />
            </label>
            <label className="field" htmlFor="profile-phone">
              <span>Phone</span>
              <input
                id="profile-phone"
                value={draftProfile.phone}
                onChange={(event) => setDraftProfile({ ...draftProfile, phone: event.target.value })}
              />
            </label>
          </div>
          <label className="field" htmlFor="profile-address">
            <span>Address</span>
            <textarea
              id="profile-address"
              value={draftProfile.address}
              onChange={(event) => setDraftProfile({ ...draftProfile, address: event.target.value })}
            />
          </label>
          <label className="field" htmlFor="profile-avatar">
            <span>Profile document</span>
            <input
              id="profile-avatar"
              type="file"
              onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
            />
          </label>
          {fileName ? <p className="inline-status" role="status">Selected file: {fileName}</p> : null}
          <label className="checkbox-field" htmlFor="marketing-opt-in">
            <input
              id="marketing-opt-in"
              type="checkbox"
              checked={draftProfile.marketingOptIn}
              onChange={(event) =>
                setDraftProfile({ ...draftProfile, marketingOptIn: event.target.checked })
              }
            />
            <span>Receive order and offer notifications</span>
          </label>
          <button className="button primary" type="submit">
            Save profile
          </button>
        </form>
      ) : null}
    </section>
  );
}

export default App;
