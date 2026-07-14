import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { DomainError } from "./database.js";
import { rootDir } from "./config.js";
import { verifyPassword } from "./passwords.js";
import { createToken, verifyToken } from "./tokens.js";

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function errorPayload(code, message) {
  return { error: { code, message } };
}

function positiveInteger(value, fieldName) {
  if (typeof value === "string" && !/^[1-9]\d*$/.test(value)) {
    throw new DomainError(400, "INVALID_REQUEST", `${fieldName} must be a positive integer`);
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1) {
    throw new DomainError(400, "INVALID_REQUEST", `${fieldName} must be a positive integer`);
  }
  return result;
}

export function createApp({ store, tokenSecret, apiDelayMs = 0, databaseTarget, processId = process.pid }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "64kb" }));

  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  if (apiDelayMs > 0) {
    app.use("/api", (_req, _res, next) => setTimeout(next, apiDelayMs));
  }

  const requireAuth = (req, res, next) => {
    const authorization = req.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      res.set("WWW-Authenticate", "Bearer");
      return res.status(401).json(errorPayload("AUTH_REQUIRED", "A bearer token is required"));
    }
    const payload = verifyToken(authorization.slice(7), tokenSecret);
    if (!payload) {
      res.set("WWW-Authenticate", 'Bearer error="invalid_token"');
      return res.status(401).json(errorPayload("INVALID_TOKEN", "The bearer token is invalid or expired"));
    }
    req.customer = {
      id: Number(payload.sub),
      persona: payload.persona,
      email: payload.email
    };
    next();
  };

  app.get("/api/health", asyncRoute(async (_req, res) => {
    await store.ping();
    res.json({
      status: "UP",
      service: "shopkart",
      database: store.dialect,
      databaseTarget,
      processId
    });
  }));

  app.post("/api/auth/login", asyncRoute(async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || email.length > 120 || !password || password.length > 128) {
      return res.status(400).json(errorPayload("INVALID_REQUEST", "Email and password must be within the supported input limits"));
    }

    const customer = await store.findCustomerByEmail(email);
    if (!customer || !verifyPassword(password, customer.passwordHash)) {
      res.set("WWW-Authenticate", 'Bearer error="invalid_credentials"');
      return res.status(401).json(errorPayload("INVALID_CREDENTIALS", "Email or password is incorrect"));
    }

    return res.json({
      token: createToken(customer, tokenSecret),
      customerId: customer.id,
      customer: {
        id: customer.id,
        persona: customer.persona,
        email: customer.email,
        displayName: customer.displayName
      }
    });
  }));

  app.get("/api/products", asyncRoute(async (req, res) => {
    const query = String(req.query.q || "");
    if (query.length > 80) {
      return res.status(400).json(errorPayload("QUERY_TOO_LONG", "Search text cannot exceed 80 characters"));
    }
    return res.json(await store.listProducts(query));
  }));

  app.get("/api/products/:sku", asyncRoute(async (req, res) => {
    const product = await store.findProduct(req.params.sku);
    return product
      ? res.json(product)
      : res.status(404).json(errorPayload("PRODUCT_NOT_FOUND", "Product was not found"));
  }));

  app.post("/api/carts", requireAuth, asyncRoute(async (req, res) => {
    const cart = await store.createCart(req.customer.id);
    return res.status(201).json(cart);
  }));

  app.get("/api/carts/:id", requireAuth, asyncRoute(async (req, res) => {
    return res.json(await store.getCart(positiveInteger(req.params.id, "cart id"), req.customer.id));
  }));

  app.post("/api/carts/:id/items", requireAuth, asyncRoute(async (req, res) => {
    const cart = await store.addCartItem(
      positiveInteger(req.params.id, "cart id"),
      req.customer.id,
      String(req.body?.sku || "").trim(),
      req.body?.qty
    );
    return res.json(cart);
  }));

  app.post("/api/carts/:id/coupon", requireAuth, asyncRoute(async (req, res) => {
    const cart = await store.applyCoupon(
      positiveInteger(req.params.id, "cart id"),
      req.customer.id,
      req.body?.code
    );
    return res.json(cart);
  }));

  app.post("/api/orders", requireAuth, asyncRoute(async (req, res) => {
    const order = await store.placeOrder(
      positiveInteger(req.body?.cartId, "cartId"),
      req.customer.id,
      req.body?.address
    );
    return res.status(201).json(order);
  }));

  app.get("/api/orders/:id", requireAuth, asyncRoute(async (req, res) => {
    return res.json(await store.getOrder(positiveInteger(req.params.id, "order id"), req.customer.id));
  }));

  app.post("/api/orders/:id/cancel", requireAuth, asyncRoute(async (req, res) => {
    return res.json(await store.cancelOrder(positiveInteger(req.params.id, "order id"), req.customer.id));
  }));

  const openApiPath = path.join(rootDir, "openapi.yaml");
  app.get("/openapi.yaml", (_req, res) => res.type("application/yaml").send(fs.readFileSync(openApiPath, "utf8")));
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      customSiteTitle: "ShopKart API",
      swaggerOptions: { url: "/openapi.yaml", persistAuthorization: true }
    })
  );

  const frontendDist = path.join(rootDir, "frontend", "dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist, { index: false }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/") || req.path === "/openapi.yaml") {
        return next();
      }
      return res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.use((req, res) => res.status(404).json(errorPayload("ROUTE_NOT_FOUND", "Route was not found")));
  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return res.status(400).json(errorPayload("INVALID_JSON", "Request body must contain valid JSON"));
    }
    if (error instanceof DomainError) {
      return res.status(error.status).json(errorPayload(error.code, error.message));
    }
    console.error(`Unhandled ShopKart error: ${error.message}`);
    return res.status(500).json(errorPayload("INTERNAL_ERROR", "An unexpected error occurred"));
  });

  return app;
}
