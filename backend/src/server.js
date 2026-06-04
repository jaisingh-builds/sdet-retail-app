import cors from "cors";
import express from "express";
import morgan from "morgan";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const users = [
  { id: 1, email: "customer@example.com", password: "Password@123", role: "customer", locked: false, name: "Customer User" },
  { id: 2, email: "admin@example.com", password: "Password@123", role: "admin", locked: false, name: "Admin User" },
  { id: 3, email: "support@example.com", password: "Password@123", role: "support", locked: false, name: "Support User" },
  { id: 4, email: "locked@example.com", password: "Password@123", role: "customer", locked: true, name: "Locked User" },
  { id: 5, email: "user@test.com", password: "Secret123", role: "customer", locked: false, name: "Demo User" }
];

let products = [
  { id: 101, name: "Wireless Mouse", category: "Accessories", price: 799, stock: 25 },
  { id: 102, name: "USB-C Keyboard", category: "Accessories", price: 1499, stock: 12 },
  { id: 103, name: "Noise Cancelling Headset", category: "Audio", price: 3499, stock: 8 },
  { id: 104, name: "Laptop Stand", category: "Workspace", price: 1199, stock: 15 }
];

let cart = [];
let orders = [];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tokenFor = (user) => `demo-token-${user.id}-${user.role}`;

function currentUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  const id = Number(token.split("-")[2]);
  return users.find((user) => user.id === id);
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin role required" });
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "sdet-retail-app" });
});

app.get("/api/debug/cart-total", async (req, res) => {
  const requestedDelay = Number(req.query.delay || 700);
  await delay(Math.min(requestedDelay, 3000));
  res.json({
    items: [
      { name: "Running Shoes", quantity: 2, lineTotal: 8998 },
      { name: "Express shipping", quantity: 1, lineTotal: 199 }
    ],
    subtotal: 8998,
    shipping: 199,
    total: 9197,
    ready: true
  });
});

function handleLogin(req, res) {
  const { email, password } = req.body;
  const user = users.find((item) => item.email === email);

  if (!user || user.password !== password || email === "invalid@example.com") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.locked) {
    return res.status(423).json({ message: "Account is locked" });
  }

  res.json({
    token: tokenFor(user),
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  });
}

app.post("/api/auth/login", handleLogin);
app.post("/api/login", handleLogin);

app.post("/api/auth/logout", requireAuth, (_req, res) => {
  res.status(204).send();
});

app.get("/api/products", async (req, res) => {
  const requestedDelay = Number(req.query.delay || 0);
  if (process.env.BUG_SLOW_PRODUCTS_API === "true") {
    await delay(2500);
  } else if (requestedDelay > 0) {
    await delay(Math.min(requestedDelay, 3000));
  }

  const search = String(req.query.search || "").toLowerCase();
  const category = String(req.query.category || "").toLowerCase();
  let result = products;

  if (search) {
    result = result.filter((product) => product.name.toLowerCase().includes(search));
  }

  if (category) {
    result = result.filter((product) => product.category.toLowerCase() === category);
  }

  res.json({ items: result, total: result.length });
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((item) => item.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

app.post("/api/cart/items", requireAuth, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = products.find((item) => item.id === Number(productId));

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const item = { id: cart.length + 1, userId: req.user.id, productId: product.id, quantity };
  cart.push(item);
  res.status(201).json({ id: item.id, productId: product.id, quantity });
});

app.get("/api/cart", requireAuth, (req, res) => {
  const items = cart
    .filter((item) => item.userId === req.user.id)
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }));
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  res.json({ items, total });
});

app.put("/api/cart/items/:id", requireAuth, (req, res) => {
  const item = cart.find((candidate) => candidate.id === Number(req.params.id) && candidate.userId === req.user.id);
  if (!item) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  item.quantity = Number(req.body.quantity || item.quantity);
  res.json(item);
});

app.delete("/api/cart/items/:id", requireAuth, (req, res) => {
  const existingCount = cart.length;
  cart = cart.filter((item) => !(item.id === Number(req.params.id) && item.userId === req.user.id));

  if (cart.length === existingCount) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  res.status(204).send();
});

app.post("/api/orders", requireAuth, (req, res) => {
  if (process.env.BUG_CHECKOUT_RANDOM_FAILURE === "true" && Math.random() < 0.35) {
    return res.status(502).json({ message: "Payment provider timeout" });
  }

  const items = cart.filter((item) => item.userId === req.user.id);
  const total = items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return sum + product.price * item.quantity;
  }, 0);

  const order = {
    id: orders.length + 5001,
    userId: req.user.id,
    items,
    total: process.env.BUG_WRONG_ORDER_TOTAL === "true" ? total + 99 : total,
    status: "CONFIRMED"
  };

  orders.push(order);
  cart = cart.filter((item) => item.userId !== req.user.id);
  res.status(201).json(order);
});

app.get("/api/orders", requireAuth, (req, res) => {
  res.json({ items: orders.filter((item) => item.userId === req.user.id) });
});

app.get("/api/orders/:id", requireAuth, (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id) && item.userId === req.user.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json(order);
});

app.get("/api/users/me", requireAuth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name });
});

app.get("/api/profile", requireAuth, async (req, res) => {
  await delay(500);
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name });
});

app.put("/api/users/me", requireAuth, (req, res) => {
  req.user.name = req.body.name || req.user.name;
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name });
});

app.post("/api/admin/products", requireAuth, requireAdmin, (req, res) => {
  const product = { id: Date.now(), ...req.body };
  products.push(product);
  res.status(201).json(product);
});

app.put("/api/admin/products/:id", requireAuth, requireAdmin, (req, res) => {
  const index = products.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "Product not found" });
  }
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

app.delete("/api/admin/products/:id", requireAuth, requireAdmin, (req, res) => {
  products = products.filter((item) => item.id !== Number(req.params.id));
  res.status(204).send();
});

app.get("/api/admin/orders", requireAuth, requireAdmin, (_req, res) => {
  res.json({ items: orders });
});

app.listen(port, () => {
  console.log(`SDET Retail Automation Lab API listening on http://localhost:${port}`);
});
