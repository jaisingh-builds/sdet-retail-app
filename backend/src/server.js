import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import express from "express";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";
import {
  databaseEnabled,
  databaseConnectionSummary,
  databaseFailureMessage,
  deleteOrder,
  findOrder,
  initializeDatabase,
  insertOrder
} from "./database.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, "../../.env") });

function requiredSecret(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

const users = [
  { id: 1, email: "customer@example.com", password: "Password@123", role: "customer", locked: false, name: "Customer User" },
  { id: 2, email: "admin@example.com", password: "Password@123", role: "admin", locked: false, name: "Admin User" },
  { id: 3, email: "support@example.com", password: "Password@123", role: "support", locked: false, name: "Support User" },
  { id: 4, email: "locked@example.com", password: "Password@123", role: "customer", locked: true, name: "Locked User" },
  { id: 5, email: "user@test.com", password: "Secret123", role: "customer", locked: false, name: "Demo User" }
];

const oauthClients = [
  {
    id: "retail-ops-client",
    secret: requiredSecret("OAUTH_CLIENT_SECRET"),
    subject: "svc-retail-ops",
    role: "OPS",
    scope: "orders:read orders:write",
    expiresIn: 3600
  },
  {
    id: "retail-viewer-client",
    secret: requiredSecret("OAUTH_VIEWER_CLIENT_SECRET"),
    subject: "svc-retail-viewer",
    role: "VIEWER",
    scope: "orders:read",
    expiresIn: 3600
  },
  {
    id: "retail-expired-client",
    secret: requiredSecret("OAUTH_EXPIRED_CLIENT_SECRET"),
    subject: "svc-retail-expired",
    role: "OPS",
    scope: "orders:read orders:write",
    expiresIn: -60
  }
];

const jwtSecret = requiredSecret("DEMO_JWT_SECRET");
const partnerApiKey = requiredSecret("RETAIL_API_KEY");

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

const productSearchMetadata = {
  101: {
    brand: "SwiftRun",
    sku: "FT-SHOE-101",
    summary: "Lightweight daily trainers with breathable mesh and steady heel support.",
    tags: ["Best seller", "Running", "COD eligible"]
  },
  102: {
    brand: "TrailVault",
    sku: "BG-TRVL-102",
    summary: "Cabin-friendly backpack with laptop storage, rain cover, and quick-access pockets.",
    tags: ["Travel", "Laptop safe", "Rain cover"]
  },
  103: {
    brand: "SoundNest",
    sku: "EL-AUD-103",
    summary: "Wireless over-ear headphones with long battery life and commute-ready ANC.",
    tags: ["Low stock", "Bluetooth", "ANC"]
  },
  104: {
    brand: "HydraPeak",
    sku: "FT-BTL-104",
    summary: "Leak-proof bottle that keeps drinks cold through long office and training days.",
    tags: ["Pickup ready", "BPA free", "Fitness"]
  },
  105: {
    brand: "FlexWell",
    sku: "FT-YOGA-105",
    summary: "Non-slip mat with firm cushioning for daily stretching and workout routines.",
    tags: ["Workout", "Beginner friendly", "Non-slip"]
  },
  106: {
    brand: "MonsoonLab",
    sku: "AP-RAIN-106",
    summary: "Packable waterproof jacket with taped seams and adjustable hood.",
    tags: ["Low stock", "Waterproof", "Monsoon"]
  },
  107: {
    brand: "LumaDesk",
    sku: "WS-LAMP-107",
    summary: "Dimmable desk lamp with reading, focus, and night modes for hybrid work setups.",
    tags: ["Workspace", "USB-C", "Dimmable"]
  },
  108: {
    brand: "GoodGrain",
    sku: "GR-SNCK-108",
    summary: "Assorted office snack box with millet bars, roasted nuts, and baked crisps.",
    tags: ["Fresh stock", "Office pantry", "Vegetarian"]
  },
  109: {
    brand: "TableCraft",
    sku: "HM-DINE-109",
    summary: "Microwave-safe ceramic dinner set for family dining and gifting.",
    tags: ["Low stock", "Giftable", "Fragile"]
  },
  110: {
    brand: "CoreFlex",
    sku: "FT-BAND-110",
    summary: "Five-level resistance kit with handles, door anchor, and travel pouch.",
    tags: ["Home workout", "Travel kit", "Beginner friendly"]
  },
  111: {
    brand: "GlowRoute",
    sku: "BT-SKIN-111",
    summary: "Travel-friendly cleanser, moisturiser, sunscreen, and pouch bundle.",
    tags: ["Travel", "SPF", "Giftable"]
  },
  112: {
    brand: "BrightByte",
    sku: "EL-KIDS-112",
    summary: "Kid-safe tablet with parental controls, learning apps, and shock-proof case.",
    tags: ["Low stock", "Parental controls", "Learning"]
  }
};

products = products.map((product) => ({ ...product, ...productSearchMetadata[product.id] }));

let cart = [];
let orders = [];
let nextCartItemId = 1;

const secureOrders = [
  {
    id: 5001,
    orderNumber: "ORD-5001",
    status: "Confirmed",
    payment: "Paid",
    paymentMethod: "Credit card",
    channel: "API",
    items: [
      {
        productId: 101,
        quantity: 2,
        product: { id: 101, name: "Running Shoes", category: "Footwear", price: 4499 }
      }
    ],
    subtotal: 8998,
    shipping: 49,
    discount: 0,
    total: 9047,
    address: "UST Training Lab, Bengaluru",
    deliverySlot: "Tomorrow 10 AM - 1 PM"
  }
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const tokenFor = (user) => `demo-token-${user.id}-${user.role}`;
const base64Url = (value) => Buffer.from(value).toString("base64url");
const signJwt = (unsignedToken) =>
  crypto.createHmac("sha256", jwtSecret).update(unsignedToken).digest("base64url");

function createAccessToken(client) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: "sdet-retail-demo",
    aud: "sdet-retail-api",
    sub: client.subject,
    role: client.role,
    scope: client.scope,
    iat: now,
    exp: now + client.expiresIn
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  return `${unsignedToken}.${signJwt(unsignedToken)}`;
}

function decodeJsonPart(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function parseBasicCredentials(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Basic ")) {
    return null;
  }

  const decoded = Buffer.from(auth.slice("Basic ".length), "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  return {
    id: decoded.slice(0, separatorIndex),
    secret: decoded.slice(separatorIndex + 1)
  };
}

function parseJwtToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const unsignedToken = `${parts[0]}.${parts[1]}`;
  if (signJwt(unsignedToken) !== parts[2]) {
    return null;
  }

  const payload = decodeJsonPart(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return { expired: true, payload };
  }

  return { expired: false, payload };
}

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
const maxCartQuantity = 5;
const inputLimits = {
  search: 60,
  email: 80,
  password: 64,
  cartOption: 40,
  address: 180,
  coupon: 12,
  productName: 60,
  category: 40,
  profileName: 60,
  price: { min: 1, max: 999999 },
  stock: { min: 0, max: 999 }
};

function currentUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  if (token.includes(".")) {
    const parsed = parseJwtToken(token);
    if (!parsed || parsed.expired) {
      return null;
    }

    return {
      id: 900,
      email: `${parsed.payload.sub}@service.local`,
      role: parsed.payload.role,
      scope: parsed.payload.scope || "",
      name: parsed.payload.sub,
      authType: "jwt"
    };
  }

  const id = Number(token.split("-")[2]);
  return users.find((user) => user.id === id);
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    res.set("WWW-Authenticate", 'Bearer error="missing_token"');
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = auth.slice("Bearer ".length);
  if (token.includes(".")) {
    const parsed = parseJwtToken(token);
    if (!parsed) {
      res.set("WWW-Authenticate", 'Bearer error="invalid_token"');
      return res.status(401).json({ message: "Invalid access token" });
    }
    if (parsed.expired) {
      res.set("WWW-Authenticate", 'Bearer error="invalid_token", error_description="The access token expired"');
      return res.status(401).json({ message: "Access token expired" });
    }
  }

  const user = currentUser(req);
  if (!user) {
    res.set("WWW-Authenticate", 'Bearer error="invalid_token"');
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

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: `${role} role required` });
    }
    next();
  };
}

function requireScope(scope) {
  return (req, res, next) => {
    const scopes = String(req.user.scope || "").split(" ");
    if (!scopes.includes(scope)) {
      return res.status(403).json({ message: `${scope} scope required` });
    }
    next();
  };
}

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key) {
    return res.status(401).json({ message: "API key required" });
  }
  if (key !== partnerApiKey) {
    return res.status(403).json({ message: "Invalid API key" });
  }
  next();
}

function ownerKey(req) {
  return req.headers["x-cart-session"] || `user-${req.user.id}`;
}

function parseQuantity(value, fallback = 1) {
  const quantity = Number(value ?? fallback);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxCartQuantity) {
    return null;
  }
  return quantity;
}

function limitText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function parseBoundedInteger(value, { min, max }) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    return null;
  }
  return number;
}

function searchableProductText(product) {
  return [
    product.name,
    product.category,
    product.brand,
    product.sku,
    product.summary,
    ...(product.tags || [])
  ]
    .join(" ")
    .toLowerCase();
}

function productMatchesSearch(product, query) {
  return !query || searchableProductText(product).includes(query);
}

function productForCartItem(item) {
  return products.find((product) => product.id === item.productId);
}

function mapCartItem(item) {
  return { ...item, product: productForCartItem(item) };
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sdet-retail-app",
    authDemo: "w2d4",
    persistence: databaseEnabled() ? "mysql" : "memory"
  });
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
  const email = limitText(req.body.email, inputLimits.email);
  const password = limitText(req.body.password, inputLimits.password);
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

app.post("/api/oauth/token", (req, res) => {
  const basic = parseBasicCredentials(req);
  const clientId = basic?.id || req.body.client_id;
  const clientSecret = basic?.secret || req.body.client_secret;
  const grantType = req.body.grant_type;

  if (grantType !== "client_credentials") {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }

  const client = oauthClients.find((item) => item.id === clientId && item.secret === clientSecret);
  if (!client) {
    return res.status(401).json({ error: "invalid_client" });
  }

  res.json({
    access_token: createAccessToken(client),
    token_type: "Bearer",
    expires_in: Math.max(client.expiresIn, 0),
    scope: client.scope
  });
});

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

  const search = limitText(req.query.search, inputLimits.search).toLowerCase();
  const category = limitText(req.query.category, inputLimits.category).toLowerCase();
  let result = products;

  if (search) {
    result = result.filter((product) => productMatchesSearch(product, search));
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

app.get("/api/legacy/products/:id.xml", (req, res) => {
  const product = products.find((item) => item.id === Number(req.params.id));
  if (!product) {
    return res.status(404).type("application/xml").send("<error><message>Product not found</message></error>");
  }

  res.type("application/xml").send(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<product>",
      `  <id>${product.id}</id>`,
      `  <name>${escapeXml(product.name)}</name>`,
      `  <category>${escapeXml(product.category)}</category>`,
      `  <price>${product.price}</price>`,
      "</product>"
    ].join("\n")
  );
});

app.post("/api/cart/items", requireAuth, (req, res) => {
  const { productId, quantity = 1, size = "Standard", color = "Default", fulfilment = "Home delivery" } = req.body;
  const product = products.find((item) => item.id === Number(productId));
  const requestedQuantity = parseQuantity(quantity);
  const safeSize = limitText(size, inputLimits.cartOption) || "Standard";
  const safeColor = limitText(color, inputLimits.cartOption) || "Default";
  const safeFulfilment = limitText(fulfilment, inputLimits.cartOption) || "Home delivery";

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!requestedQuantity) {
    return res.status(400).json({ message: `Quantity must be an integer between 1 and ${maxCartQuantity}` });
  }

  if (requestedQuantity > product.stock) {
    return res.status(409).json({ message: "Requested quantity exceeds available stock" });
  }

  const cartOwnerKey = ownerKey(req);
  const existingItem = cart.find(
    (item) =>
      item.ownerKey === cartOwnerKey &&
      item.productId === product.id &&
      item.size === safeSize &&
      item.color === safeColor &&
      item.fulfilment === safeFulfilment
  );

  if (existingItem) {
    const nextQuantity = existingItem.quantity + requestedQuantity;
    if (nextQuantity > maxCartQuantity) {
      return res.status(409).json({ message: `Maximum quantity per cart line is ${maxCartQuantity}` });
    }

    if (nextQuantity > product.stock) {
      return res.status(409).json({ message: "Requested quantity exceeds available stock" });
    }

    existingItem.quantity = nextQuantity;
    return res.status(200).json(mapCartItem(existingItem));
  }

  const item = {
    id: nextCartItemId,
    userId: req.user.id,
    ownerKey: cartOwnerKey,
    productId: product.id,
    quantity: requestedQuantity,
    size: safeSize,
    color: safeColor,
    fulfilment: safeFulfilment
  };
  nextCartItemId += 1;
  cart.push(item);
  res.status(201).json(mapCartItem(item));
});

app.get("/api/cart", requireAuth, (req, res) => {
  const items = cart
    .filter((item) => item.ownerKey === ownerKey(req))
    .map(mapCartItem);
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

  const quantity = parseQuantity(req.body.quantity, item.quantity);
  const product = productForCartItem(item);
  if (!quantity) {
    return res.status(400).json({ message: `Quantity must be an integer between 1 and ${maxCartQuantity}` });
  }

  if (quantity > product.stock) {
    return res.status(409).json({ message: "Requested quantity exceeds available stock" });
  }

  item.quantity = quantity;
  res.json(mapCartItem(item));
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
  if (items.length === 0) {
    return res.status(400).json({ message: "Cannot create an order from an empty cart" });
  }

  const subtotal = items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    return sum + product.price * item.quantity;
  }, 0);
  const shipping = Number(req.body.shipping || 0);
  const discount = Number(req.body.discount || 0);
  if (shipping < 0 || discount < 0 || discount > subtotal + shipping) {
    return res.status(400).json({ message: "Invalid order totals" });
  }

  const total = subtotal + shipping - discount;
  const orderNumber = `ORD-${1008 + orders.length + items.length}`;
  const paymentMethod = limitText(req.body.paymentMethod, inputLimits.cartOption) || "Credit card";
  const deliverySlot = limitText(req.body.deliverySlot, inputLimits.cartOption);
  const address = limitText(req.body.address, inputLimits.address);
  const coupon = limitText(req.body.coupon, inputLimits.coupon).toUpperCase();
  if (!address) {
    return res.status(400).json({ message: "Delivery address is required" });
  }

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
    items: items.map(mapCartItem),
    subtotal,
    shipping,
    discount,
    total: process.env.BUG_WRONG_ORDER_TOTAL === "true" ? total + 99 : total,
    deliverySlot,
    address,
    coupon
  };

  orders.push(order);
  cart = cart.filter((item) => item.ownerKey !== orderOwnerKey);
  res.location(`/api/orders/${order.id}`).status(201).json(order);
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

app.get("/api/secure/orders/:id", requireAuth, requireScope("orders:read"), async (req, res) => {
  const order = databaseEnabled()
    ? await findOrder(Number(req.params.id))
    : secureOrders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json(order);
});

app.post("/api/secure/orders", requireAuth, requireRole("OPS"), requireScope("orders:write"), async (req, res) => {
  const productIds = Array.isArray(req.body.items) ? req.body.items : [101];
  const items = productIds.map((productId) => {
    const product = products.find((candidate) => candidate.id === Number(productId));
    return {
      productId: product?.id || Number(productId),
      quantity: 1,
      product: product
        ? { id: product.id, name: product.name, category: product.category, price: product.price }
        : { id: Number(productId), name: "Unknown", category: "Unknown", price: 0 }
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const order = {
    id: secureOrders.length + 6001,
    orderId: secureOrders.length + 6001,
    orderNumber: `ORD-${Date.now()}`,
    status: "CREATED",
    payment: "Pending",
    paymentMethod: "API",
    channel: "API",
    items,
    subtotal,
    shipping: 0,
    discount: 0,
    total: subtotal,
    address: "API Fulfilment Queue",
    deliverySlot: "Standard"
  };

  if (databaseEnabled()) {
    const persistedOrder = await insertOrder(order, req.user.name);
    return res.location(`/api/secure/orders/${persistedOrder.id}`).status(201).json(persistedOrder);
  }

  secureOrders.push(order);
  res.location(`/api/secure/orders/${order.id}`).status(201).json(order);
});

app.delete("/api/secure/orders/:id", requireAuth, requireRole("OPS"), requireScope("orders:write"), async (req, res) => {
  if (databaseEnabled()) {
    const deleted = await deleteOrder(Number(req.params.id));
    return deleted ? res.status(204).send() : res.status(404).json({ message: "Order not found" });
  }

  const orderIndex = secureOrders.findIndex((item) => item.id === Number(req.params.id));
  if (orderIndex === -1) {
    return res.status(404).json({ message: "Order not found" });
  }
  secureOrders.splice(orderIndex, 1);
  res.status(204).send();
});

app.get("/api/partner/orders/:id", requireApiKey, (req, res) => {
  const order = secureOrders.find((item) => item.id === Number(req.params.id));
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json({ partner: "UST Partner Channel", order });
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
  const name = limitText(req.body.name, inputLimits.profileName);
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  req.user.name = name;
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role, name: req.user.name });
});

app.post("/api/admin/products", requireAuth, requireAdmin, (req, res) => {
  const name = limitText(req.body.name, inputLimits.productName);
  const category = limitText(req.body.category, inputLimits.category);
  const price = parseBoundedInteger(req.body.price, inputLimits.price);
  const stock = parseBoundedInteger(req.body.stock, inputLimits.stock);
  if (!name || !category || price === null || stock === null) {
    return res.status(400).json({ message: "Product name, category, price, and stock are required within allowed limits" });
  }

  const product = { id: Date.now(), ...req.body, name, category, price, stock };
  products.push(product);
  res.status(201).json(product);
});

app.put("/api/admin/products/:id", requireAuth, requireAdmin, (req, res) => {
  const index = products.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "Product not found" });
  }
  const changes = { ...req.body };
  if ("name" in changes) {
    changes.name = limitText(changes.name, inputLimits.productName);
    if (!changes.name) {
      return res.status(400).json({ message: "Product name is required" });
    }
  }
  if ("category" in changes) {
    changes.category = limitText(changes.category, inputLimits.category);
    if (!changes.category) {
      return res.status(400).json({ message: "Product category is required" });
    }
  }
  if ("price" in changes) {
    changes.price = parseBoundedInteger(changes.price, inputLimits.price);
    if (changes.price === null) {
      return res.status(400).json({ message: "Product price is outside allowed limits" });
    }
  }
  if ("stock" in changes) {
    changes.stock = parseBoundedInteger(changes.stock, inputLimits.stock);
    if (changes.stock === null) {
      return res.status(400).json({ message: "Product stock is outside allowed limits" });
    }
  }
  products[index] = { ...products[index], ...changes };
  res.json(products[index]);
});

app.delete("/api/admin/products/:id", requireAuth, requireAdmin, (req, res) => {
  products = products.filter((item) => item.id !== Number(req.params.id));
  res.status(204).send();
});

app.get("/api/admin/orders", requireAuth, requireAdmin, (_req, res) => {
  res.json({ items: orders });
});

try {
  console.log(`Database enabled: ${databaseEnabled()}`);
  console.log(`Database target: ${databaseConnectionSummary()}`);
  await initializeDatabase(secureOrders[0]);
  if (databaseEnabled()) {
    console.log("MySQL connection and schema initialization succeeded.");
  }
  app.listen(port, () => {
    const persistence = databaseEnabled() ? "MySQL" : "in-memory data";
    console.log(`SDET Retail Automation Lab API listening on http://localhost:${port} using ${persistence}`);
  });
} catch (error) {
  console.error("Retail API failed to initialize MySQL.");
  console.error(`Database enabled: ${databaseEnabled()}`);
  console.error(`Database target: ${databaseConnectionSummary()}`);
  console.error(databaseFailureMessage(error));
  process.exit(1);
}
