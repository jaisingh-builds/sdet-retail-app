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
  { id: 101, name: "Running Shoes", category: "Footwear", price: 4499, stock: 18 },
  { id: 102, name: "Travel Backpack", category: "Bags", price: 3299, stock: 11 },
  { id: 103, name: "Noise Canceling Headphones", category: "Electronics", price: 7999, stock: 7 },
  { id: 104, name: "Insulated Water Bottle", category: "Fitness", price: 999, stock: 42 },
  { id: 105, name: "Yoga Mat", category: "Fitness", price: 1499, stock: 23 },
  { id: 106, name: "Rain Jacket", category: "Apparel", price: 2799, stock: 9 },
  { id: 107, name: "Smart Desk Lamp", category: "Workspace", price: 2199, stock: 16 },
  { id: 108, name: "Organic Snack Box", category: "Grocery", price: 1199, stock: 35 },
  { id: 109, name: "Ceramic Dinner Set", category: "Home", price: 3899, stock: 6 },
  { id: 110, name: "Resistance Bands Kit", category: "Fitness", price: 1299, stock: 31 },
  { id: 111, name: "Skin Care Travel Kit", category: "Beauty", price: 2499, stock: 14 },
  { id: 112, name: "Kids Learning Tablet", category: "Electronics", price: 9999, stock: 5 }
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

function ownerKey(req) {
  return req.headers["x-cart-session"] || `user-${req.user.id}`;
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
  const { productId, quantity = 1, size = "Standard", color = "Default", fulfilment = "Home delivery" } = req.body;
  const product = products.find((item) => item.id === Number(productId));

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const item = {
    id: cart.length + 1,
    userId: req.user.id,
    ownerKey: ownerKey(req),
    productId: product.id,
    quantity,
    size,
    color,
    fulfilment
  };
  cart.push(item);
  res.status(201).json({ ...item, product });
});

app.get("/api/cart", requireAuth, (req, res) => {
  const items = cart
    .filter((item) => item.ownerKey === ownerKey(req))
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }));
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  res.json({ items, total });
});

app.delete("/api/cart", requireAuth, (req, res) => {
  cart = cart.filter((item) => item.ownerKey !== ownerKey(req));
  res.status(204).send();
});

app.put("/api/cart/items/:id", requireAuth, (req, res) => {
  const item = cart.find((candidate) => candidate.id === Number(req.params.id) && candidate.ownerKey === ownerKey(req));
  if (!item) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  item.quantity = Number(req.body.quantity || item.quantity);
  res.json(item);
});

app.delete("/api/cart/items/:id", requireAuth, (req, res) => {
  const existingCount = cart.length;
  cart = cart.filter((item) => !(item.id === Number(req.params.id) && item.ownerKey === ownerKey(req)));

  if (cart.length === existingCount) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  res.status(204).send();
});

app.post("/api/orders", requireAuth, (req, res) => {
  if (process.env.BUG_CHECKOUT_RANDOM_FAILURE === "true" && Math.random() < 0.35) {
    return res.status(502).json({ message: "Payment provider timeout" });
  }

  const orderOwnerKey = ownerKey(req);
  const items = cart.filter((item) => item.ownerKey === orderOwnerKey);
  const subtotal = items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return sum + product.price * item.quantity;
  }, 0);
  const shipping = Number(req.body.shipping || 0);
  const discount = Number(req.body.discount || 0);
  const total = subtotal + shipping - discount;
  const orderNumber = `ORD-${1008 + orders.length + items.length}`;
  const paymentMethod = req.body.paymentMethod || "Credit card";

  const order = {
    id: orders.length + 5001,
    orderNumber,
    userId: req.user.id,
    ownerKey: orderOwnerKey,
    placedOn: new Date().toISOString().slice(0, 10),
    status: paymentMethod === "Cash on delivery" ? "Payment pending" : "Confirmed",
    payment: paymentMethod === "Cash on delivery" ? "Pending" : "Paid",
    paymentMethod,
    channel: "Web",
    items: items.map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.productId)
    })),
    subtotal,
    shipping,
    discount,
    total: process.env.BUG_WRONG_ORDER_TOTAL === "true" ? total + 99 : total,
    deliverySlot: req.body.deliverySlot,
    address: req.body.address
  };

  orders.push(order);
  cart = cart.filter((item) => item.ownerKey !== orderOwnerKey);
  res.status(201).json(order);
});

app.get("/api/orders", requireAuth, (req, res) => {
  res.json({ items: orders.filter((item) => item.ownerKey === ownerKey(req)) });
});

app.get("/api/orders/:id", requireAuth, (req, res) => {
  const order = orders.find((item) => item.id === Number(req.params.id) && item.ownerKey === ownerKey(req));
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json(order);
});

app.get("/api/users/me", requireAuth, async (req, res) => {
  const requestedDelay = Number(req.query.delay || 0);
  if (requestedDelay > 0) {
    await delay(Math.min(requestedDelay, 3000));
  }

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
