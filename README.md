# SDET Retail Automation Lab

Starter application for the UST Global 42-day SDET training program.

This repo is the controlled classroom app used for UI automation, API automation, database validation, microservices contract testing, mocking, debugging, CI, and capstone work.

## Target Architecture

The training app will use a classroom-friendly microservices slice:

```text
ReactJS frontend
  |
POS / retail API service
  |
  |-- PostgreSQL
  |-- OMS service
  |-- WireMock: payment, inventory, shipping, notification
```

The app should not become a large production-style microservice platform. The goal is to support the Week 4 and Week 7 planner outcomes: service virtualisation, POS-to-OMS Pact contracts, CI contract gates, resilience testing, and integrated capstone validation.

## What Is Included

- `backend/`: Current starter API. Development target is NestJS services for POS/retail API and OMS.
- `frontend/`: ReactJS + Vite Day 1 classroom UI shell.
- `seed-data/`: Users and products for repeatable labs.
- `openapi.yaml`: API contract for testing and documentation.
- `wiremock/`: Mock-service starter mappings.
- `docker-compose.yml`: Local service orchestration starter.
- `docs/development-plan.md`: Development roadmap for the full classroom app.
- `docs/architecture-decision.md`: Architecture decisions for ReactJS, NestJS, PostgreSQL, microservices, WireMock, and Pact.

## Seed Credentials

| Role | Username | Password |
| --- | --- | --- |
| Customer | `customer@example.com` | `Password@123` |
| Admin | `admin@example.com` | `Password@123` |
| Support | `support@example.com` | `Password@123` |
| Locked | `locked@example.com` | `Password@123` |

## Frontend Training Surface

```bash
cd frontend
npm install
npm run dev
```

Open the app at:

```bash
http://localhost:5173
```

The current ReactJS starter includes classroom-ready pages for:

- Login and negative authentication.
- Home and navigation smoke tests.
- Product catalog search, filter, sort, and product detail.
- Cart, checkout, coupon, and order confirmation.
- Orders history and status filtering.
- Profile form and file-upload locator practice.
- Admin product creation/filtering and admin order queue filtering.

## Current Starter Backend

```bash
cd backend
npm install
npm start
```

Backend health check:

```bash
curl http://localhost:4000/api/health
```

This starter API is intentionally small. It exists so the automation repos have a runnable target immediately. The planned build will evolve this into NestJS-based POS/retail and OMS services.

## Feature Flags

```env
BUG_SLOW_PRODUCTS_API=false
BUG_CHECKOUT_RANDOM_FAILURE=false
BUG_MISSING_ALT_TEXT=false
BUG_WRONG_ORDER_TOTAL=false
BUG_UNSTABLE_TOAST=false
BUG_BROKEN_ADMIN_FILTER=false
```

## Classroom Flow

Use this app across the whole course:

1. Playwright UI foundation.
2. API automation.
3. Selenium Java comparison.
4. Mocking and contract testing.
5. Debugging and reliability.
6. Framework maturity and CI.
7. Final capstone.
