import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LogIn,
  LogOut,
  Search,
  ShoppingBag,
  ShoppingCart
} from "lucide-react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function money(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(paise) / 100);
}

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) {
    if (response.status === 401 && token) {
      sessionStorage.removeItem("shopkart.session");
      window.dispatchEvent(new Event("shopkart:unauthorized"));
    }
    const error = new Error(payload.error?.message || `Request failed with ${response.status}`);
    error.code = payload.error?.code;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function useLocation() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const navigate = useCallback((nextPath) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  return { path, navigate };
}

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem("shopkart.session")) || null;
  } catch {
    return null;
  }
}

function cartStorageKey(customerId) {
  return `shopkart.cart.${customerId}`;
}

async function addToActiveCart(session, sku, qty) {
  const key = cartStorageKey(session.customerId);
  let cartId = sessionStorage.getItem(key);
  if (!cartId) {
    const cart = await api("/carts", { method: "POST", token: session.token });
    cartId = String(cart.cartId);
    sessionStorage.setItem(key, cartId);
  }

  try {
    return await api(`/carts/${cartId}/items`, {
      method: "POST",
      token: session.token,
      body: { sku, qty }
    });
  } catch (error) {
    if (!["CART_NOT_FOUND", "CART_NOT_OPEN"].includes(error.code)) throw error;
    sessionStorage.removeItem(key);
    const replacement = await api("/carts", { method: "POST", token: session.token });
    sessionStorage.setItem(key, String(replacement.cartId));
    return api(`/carts/${replacement.cartId}/items`, {
      method: "POST",
      token: session.token,
      body: { sku, qty }
    });
  }
}

function AppShell({ session, onLogout, navigate, children }) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <button className="brand" type="button" onClick={() => navigate("/")} aria-label="ShopKart home">
          <span className="brand-mark"><ShoppingBag size={22} aria-hidden="true" /></span>
          <span>
            <strong>ShopKart</strong>
            <small>Capstone retail lab</small>
          </span>
        </button>
        <nav aria-label="Primary navigation">
          <button type="button" onClick={() => navigate("/")}>Catalog</button>
          {session ? (
            <>
              <button type="button" onClick={() => navigate("/cart")}>
                <ShoppingCart size={17} aria-hidden="true" /> Cart
              </button>
              <a href="/api-docs" target="_blank" rel="noreferrer">API docs</a>
              <span className="signed-in">{session.customer.displayName}</span>
              <button type="button" onClick={onLogout} aria-label="Sign out">
                <LogOut size={17} aria-hidden="true" /> Sign out
              </button>
            </>
          ) : (
            <button type="button" onClick={() => navigate("/login")}>
              <LogIn size={17} aria-hidden="true" /> Sign in
            </button>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <span>ShopKart training environment</span>
        <span>Prices use integer paise</span>
      </footer>
    </div>
  );
}

function LoginPage({ onLogin, navigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/login", { method: "POST", body: { email, password } });
      onLogin(result);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <h1>Sign in to continue shopping</h1>
        <p>Use your assigned ShopKart test persona. Credentials are resolved from your local secret source and never belong in feature files.</p>
      </div>
      <form className="auth-form" onSubmit={submit} aria-label="ShopKart sign in">
        <h2>Customer sign in</h2>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        {error ? <div className="alert error" role="alert">{error}</div> : null}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
    </section>
  );
}

function CatalogPage({ session, navigate }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [addingSku, setAddingSku] = useState("");

  const loadProducts = useCallback(async (searchText = "") => {
    setLoading(true);
    setError("");
    try {
      setProducts(await api(`/products?q=${encodeURIComponent(searchText)}`));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  function search(event) {
    event.preventDefault();
    loadProducts(query);
  }

  async function quickAdd(product) {
    if (!session) {
      navigate("/login");
      return;
    }
    setError("");
    setNotice("");
    setAddingSku(product.sku);
    try {
      await addToActiveCart(session, product.sku, 1);
      setNotice(`${product.name} added to cart`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAddingSku("");
    }
  }

  return (
    <div className="page catalog-page">
      <section className="catalog-heading">
        <div>
          <h1>Useful things, thoughtfully selected.</h1>
          <p>One deterministic catalogue for UI, API, database, security and reporting exercises.</p>
        </div>
        <form className="search-form" role="search" onSubmit={search}>
          <label className="visually-hidden" htmlFor="catalog-search">Search products</label>
          <Search size={19} aria-hidden="true" />
          <input id="catalog-search" name="q" type="search" maxLength={80} placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="submit">Search</button>
        </form>
      </section>
      {error ? <div className="alert error" role="alert">{error}</div> : null}
      {notice ? <div className="alert success" role="status">{notice}</div> : null}
      {loading ? <p className="status-message" role="status">Loading products...</p> : null}
      {!loading && products.length === 0 ? <p className="status-message">No products match your search.</p> : null}
      <section className="product-grid" aria-label="Products">
        {products.map((product) => (
          <div className="product-card product" role="article" key={product.sku}>
            <button className={`product-image image-${product.imageKey}`} type="button" onClick={() => navigate(`/product/${product.sku}`)} aria-label={`Open ${product.name}`} />
            <div className="product-body">
              <div className="product-meta"><span>{product.category}</span><span>{product.sku}</span></div>
              <h2><button type="button" onClick={() => navigate(`/product/${product.sku}`)}>{product.name}</button></h2>
              <p>{product.description}</p>
              <div className="product-footer">
                <strong>{money(product.pricePaise)}</strong>
                <span className={product.stock === 0 ? "stock out" : "stock"}>{product.stock === 0 ? "Out of stock" : `${product.stock} available`}</span>
              </div>
              <button className="quick-add" type="button" onClick={() => quickAdd(product)} disabled={product.stock === 0 || Boolean(addingSku)}>{addingSku === product.sku ? "Adding..." : "Add to cart"}</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function ProductPage({ sku, session, navigate }) {
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/products/${encodeURIComponent(sku)}`).then(setProduct).catch((requestError) => setError(requestError.message));
  }, [sku]);

  async function addToCart() {
    if (!session) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await addToActiveCart(session, sku, qty);
      navigate("/cart");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !product) return <div className="page"><div className="alert error" role="alert">{error}</div></div>;
  if (!product) return <div className="page"><p role="status">Loading product...</p></div>;

  return (
    <div className="page">
      <button className="back-button" type="button" onClick={() => navigate("/")}><ArrowLeft size={18} aria-hidden="true" /> Back to catalog</button>
      <section className="product-detail">
        <div className={`detail-image image-${product.imageKey}`} role="img" aria-label={product.name} />
        <div className="detail-copy">
          <span className="category-label">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="sku">{product.sku}</p>
          <p>{product.description}</p>
          <strong className="detail-price">{money(product.pricePaise)}</strong>
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" name="quantity" type="number" min="1" max={Math.max(product.stock, 1)} value={qty} onChange={(event) => setQty(Number(event.target.value))} />
          {error ? <div className="alert error" role="alert">{error}</div> : null}
          <button className="primary-button" type="button" onClick={addToCart} disabled={busy || product.stock === 0}>
            <ShoppingCart size={19} aria-hidden="true" /> {product.stock === 0 ? "Out of stock" : busy ? "Adding..." : "Add to cart"}
          </button>
        </div>
      </section>
    </div>
  );
}

function CartPage({ session, navigate }) {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) return;
    const cartId = sessionStorage.getItem(cartStorageKey(session.customerId));
    if (!cartId) return;
    api(`/carts/${cartId}`, { token: session.token }).then(setCart).catch((requestError) => {
      if (requestError.code === "CART_NOT_FOUND") {
        sessionStorage.removeItem(cartStorageKey(session.customerId));
        setCart(null);
        return;
      }
      setError(requestError.message);
    });
  }, [session]);

  if (!session) return <RequireLogin navigate={navigate} />;
  if (error) return <div className="page"><div className="alert error" role="alert">{error}</div></div>;
  if (!cart || cart.items.length === 0) {
    return <div className="page empty-state"><ShoppingCart size={38} aria-hidden="true" /><h1>Your cart is empty</h1><button className="primary-button" type="button" onClick={() => navigate("/")}>Browse products</button></div>;
  }

  return (
    <div className="page narrow-page">
      <h1>Your cart</h1>
      <table className="cart-table">
        <caption>Items selected for checkout</caption>
        <thead><tr><th scope="col">Product</th><th scope="col">SKU</th><th scope="col">Qty</th><th scope="col">Line total</th></tr></thead>
        <tbody>
          {cart.items.map((item) => (
            <tr className="cart-line" key={item.sku}>
              <td>{item.name}</td><td>{item.sku}</td><td>{item.qty}</td><td className="line-total">{money(item.lineTotalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cart-summary"><span>Total</span><strong data-role="cart-total">{money(cart.totalPaise)}</strong></div>
      <div className="action-row"><button type="button" onClick={() => navigate("/")}>Continue shopping</button><button className="primary-button" type="button" onClick={() => navigate("/checkout")}>Checkout</button></div>
    </div>
  );
}

function CheckoutPage({ session, navigate }) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!session) return <RequireLogin navigate={navigate} />;

  async function placeOrder(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const key = cartStorageKey(session.customerId);
      const cartId = sessionStorage.getItem(key);
      if (!cartId) throw new Error("Your cart is empty");
      const order = await api("/orders", {
        method: "POST",
        token: session.token,
        body: { cartId: Number(cartId), address }
      });
      sessionStorage.removeItem(key);
      navigate(`/orders/${order.orderId}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow-page">
      <form className="checkout-form" onSubmit={placeOrder}>
        <h1>Checkout</h1>
        <p>Confirm a delivery address, then place one deterministic order from your current cart.</p>
        <label htmlFor="address">Delivery address</label>
        <textarea id="address" name="address" minLength={10} maxLength={240} rows={5} value={address} onChange={(event) => setAddress(event.target.value)} required />
        {error ? <div className="alert error" role="alert">{error}</div> : null}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Placing order..." : "Place order"}</button>
      </form>
    </div>
  );
}

function OrderPage({ orderId, session, navigate }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) return;
    api(`/orders/${orderId}`, { token: session.token }).then(setOrder).catch((requestError) => setError(requestError.message));
  }, [orderId, session]);
  if (!session) return <RequireLogin navigate={navigate} />;
  if (error) return <div className="page"><div className="alert error" role="alert">{error}</div></div>;
  if (!order) return <div className="page"><p role="status">Loading order...</p></div>;

  return (
    <div className="page narrow-page">
      <section className="order-confirmation">
        <CheckCircle2 size={46} aria-hidden="true" />
        <p>Order #{order.orderId}</p>
        <h1>Order confirmed</h1>
        <dl>
          <div><dt>Status</dt><dd data-field="order-status">{order.status}</dd></div>
          <div><dt>Total</dt><dd data-field="order-total">{money(order.totalPaise)}</dd></div>
          <div><dt>Delivery address</dt><dd>{order.address}</dd></div>
        </dl>
        <button className="primary-button" type="button" onClick={() => navigate("/")}>Return to catalog</button>
      </section>
    </div>
  );
}

function RequireLogin({ navigate }) {
  return <div className="page empty-state"><LogIn size={38} aria-hidden="true" /><h1>Sign in required</h1><button className="primary-button" type="button" onClick={() => navigate("/login")}>Sign in</button></div>;
}

export default function App() {
  const { path, navigate } = useLocation();
  const [session, setSession] = useState(readSession);

  useEffect(() => {
    const expireSession = () => {
      setSession(null);
      navigate("/login");
    };
    window.addEventListener("shopkart:unauthorized", expireSession);
    return () => window.removeEventListener("shopkart:unauthorized", expireSession);
  }, [navigate]);

  function login(result) {
    const nextSession = { token: result.token, customerId: result.customerId, customer: result.customer };
    sessionStorage.setItem("shopkart.session", JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function logout() {
    sessionStorage.removeItem("shopkart.session");
    setSession(null);
    navigate("/login");
  }

  let page;
  const productMatch = path.match(/^\/product\/([^/]+)$/);
  const orderMatch = path.match(/^\/orders\/(\d+)$/);
  if (path === "/login") page = <LoginPage onLogin={login} navigate={navigate} />;
  else if (productMatch) page = <ProductPage sku={decodeURIComponent(productMatch[1])} session={session} navigate={navigate} />;
  else if (path === "/cart") page = <CartPage session={session} navigate={navigate} />;
  else if (path === "/checkout") page = <CheckoutPage session={session} navigate={navigate} />;
  else if (orderMatch) page = <OrderPage orderId={orderMatch[1]} session={session} navigate={navigate} />;
  else page = <CatalogPage session={session} navigate={navigate} />;

  return <AppShell session={session} onLogout={logout} navigate={navigate}>{page}</AppShell>;
}
