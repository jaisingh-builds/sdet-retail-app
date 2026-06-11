# SDET Retail Automation Lab Development Plan

## Objective

Develop **SDET Retail Automation Lab** into a stable, self-hosted retail training application for the UST Global 42-day SDET program.

The app must be small enough for freshers to understand, but rich enough to support UI automation, API automation, database validation, mocking, contract testing, debugging, accessibility, CI, and final capstone work.

## Guiding Principles

- Keep the business domain simple: retail catalogue, cart, checkout, orders, profile, and admin.
- Make the app intentionally testable with semantic HTML, labels, roles, stable test IDs, deterministic seed data, and reset scripts.
- Keep defects controlled by feature flags, not random source-code edits during class.
- Prefer repeatable local setup through Docker Compose.
- Keep classroom reliability higher than production realism.
- Use public demo apps only as backups; this app remains the primary target.

## Target Architecture

```text
sdet-retail-app
├── frontend/              ReactJS UI for trainee automation
├── services/
│   ├── pos-service/       NestJS POS/retail API
│   └── oms-service/       NestJS order management service
├── database/              PostgreSQL schema, migrations, reset scripts
├── seed-data/             Users, products, orders, and scenario fixtures
├── wiremock/              Payment, shipping, inventory, notification mocks
├── docs/                  Project, development, backup, and trainer notes
├── openapi.yaml           API contract
└── docker-compose.yml     App, database, mocks, and optional tools
```

## Recommended Technology Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | ReactJS + Vite | ReactJS is the UI library; Vite is the fast local build/dev tool. |
| Backend services | NestJS | Structured modules, DTOs, validation, Swagger/OpenAPI support, and enterprise-style organization. |
| Database | PostgreSQL | Enterprise-relevant DB validation practice. |
| ORM/query | Prisma | Repeatable schema, migrations, and seed workflows. |
| Mock services | WireMock | Clear request/response mapping for payment and notification labs. |
| Contracts | Pact | Consumer-driven contract testing for POS-to-OMS integration. |
| API docs | OpenAPI/Swagger UI | Supports API automation and contract discussion. |
| Local runtime | Docker Compose | Repeatable setup for trainees. |
| CI | GitHub Actions | Public repo-friendly automation pipeline. |

## Development Milestones

### Milestone 0: Baseline Stabilization

Goal: Convert the starter repo into a dependable base.

Deliverables:

- Confirm repo scripts for POS service start, OMS service start, frontend start, tests, lint, and Docker Compose.
- Add shared environment documentation.
- Add `.env.example` coverage for all services.
- Add health checks for API, database, and WireMock.
- Add root README setup flow for trainers and students.

Acceptance criteria:

- A new trainee can clone the repo and run the app locally.
- `docker compose up` starts all required services.
- Health endpoints are documented and return predictable responses.

### Milestone 1: POS/Retail Service Core API

Goal: Implement a proper POS/retail API with persistent data and resettable state.

Deliverables:

- NestJS POS service scaffold.
- PostgreSQL integration.
- Database schema for users, products, carts, orders, order items, and profile data.
- Migration and seed scripts.
- Auth endpoints:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- Product endpoints:
  - `GET /api/products`
  - `GET /api/products/{id}`
- Cart endpoints:
  - `POST /api/cart/items`
  - `PUT /api/cart/items/{id}`
  - `DELETE /api/cart/items/{id}`
  - `GET /api/cart`
- Order endpoints:
  - `POST /api/orders`
  - `GET /api/orders`
  - `GET /api/orders/{id}`
- User profile endpoints:
  - `GET /api/users/me`
  - `PUT /api/users/me`
- Admin endpoints:
  - `POST /api/admin/products`
  - `PUT /api/admin/products/{id}`
  - `DELETE /api/admin/products/{id}`
  - `GET /api/admin/orders`

Acceptance criteria:

- APIs match `openapi.yaml`.
- POS service exposes Swagger/OpenAPI documentation.
- Seed data can be reset with one command.
- Customer, admin, support, locked, and invalid-user scenarios are covered.
- API responses are stable enough for training assertions.

### Milestone 1B: OMS Microservice Slice

Goal: Add the microservice boundary required for Week 4 contract-testing labs without turning the whole app into a heavy distributed system.

Deliverables:

- NestJS OMS service scaffold.
- OMS endpoints:
  - `POST /oms/orders`
  - `GET /oms/orders/{id}`
  - `GET /oms/orders`
- POS checkout flow calls OMS to create orders.
- Pact consumer tests for POS expectations.
- Pact provider verification for OMS.
- Local Pact broker option through Docker Compose.
- Breaking-change demo endpoint or branch note.

Acceptance criteria:

- POS-to-OMS interaction can be tested with Pact.
- Contract verification can fail on an intentional breaking change.
- Week 4 CI contract gate can be demonstrated locally or in CI.
- The UI flow remains simple for Week 1-3 learners.

### Milestone 2: Frontend Core UI

Goal: Build the user-facing UI used by Playwright and Selenium trainees.

Deliverables:

- App shell with navigation and role-aware menu.
- Login/logout page.
- Home page.
- Product listing with search, filter, sort, and pagination.
- Product detail page.
- Cart page with quantity update and remove flow.
- Checkout page with payment result handling.
- Orders page and order detail view.
- Profile page with forms and file-upload placeholder.
- Admin product management page.
- Admin order management page.

Testability requirements:

- Use accessible labels for all form controls.
- Use semantic buttons, links, headings, tables, alerts, and dialogs.
- Add stable `data-testid` values only where role/text/label locators are insufficient.
- Keep loading, empty, success, and error states visible and deterministic.
- Avoid layout shifts that make classroom screenshots confusing.

Acceptance criteria:

- All planned routes render successfully.
- Customer and admin workflows can be completed through the UI.
- The UI works consistently in Chromium and Chrome.
- Login, product search, cart, checkout, order, profile, and admin flows are ready for automation.

### Milestone 3: Mock Services And Service Virtualisation

Goal: Add downstream service behavior for mocking and contract-testing labs.

Deliverables:

- WireMock mapping for payment success.
- WireMock mapping for payment decline.
- WireMock mapping for payment timeout.
- WireMock mapping for shipping estimate.
- WireMock mapping for notification accepted/failure.
- POS and OMS integration points for payment, inventory, shipping, and notification mocks.
- Trainer notes explaining how to swap mappings during class.

Acceptance criteria:

- Checkout can use WireMock instead of in-process fake logic.
- Payment failure can be demonstrated without code changes.
- API tests can validate downstream behavior through observable app responses.

### Milestone 4: Seeded Defects And Reliability Labs

Goal: Add controlled defects for Week 5 debugging and reliability exercises.

Deliverables:

| Flag | Behavior |
| --- | --- |
| `BUG_SLOW_PRODUCTS_API` | Delays product search/list API. |
| `BUG_CHECKOUT_RANDOM_FAILURE` | Produces intermittent checkout failure. |
| `BUG_MISSING_ALT_TEXT` | Removes image alt text for accessibility scan. |
| `BUG_WRONG_ORDER_TOTAL` | Creates an incorrect order total. |
| `BUG_UNSTABLE_TOAST` | Makes confirmation toast timing inconsistent. |
| `BUG_BROKEN_ADMIN_FILTER` | Breaks admin product/order filter behavior. |

Acceptance criteria:

- Every defect flag defaults to `false`.
- Each defect has a trainer note, expected symptom, and suggested evidence.
- Defects can be enabled independently.
- Defects are visible through UI/API automation, not hidden implementation details.

### Milestone 5: API Contract And Documentation

Goal: Make the app useful for API automation and contract testing.

Deliverables:

- Complete POS and OMS OpenAPI specs.
- Swagger UI route or documented OpenAPI viewer flow.
- Example API workflow collection in docs.
- JSON schema examples for products, cart, orders, and users.
- Error response format standardization.
- Contract-test scenarios for checkout/payment expectations.

Acceptance criteria:

- OpenAPI specs match implemented POS and OMS routes.
- API test repo can use the spec for schema and endpoint references.
- Trainees can execute a full auth -> product -> cart -> order chain.

### Milestone 6: CI And Release Readiness

Goal: Provide a professional delivery baseline.

Deliverables:

- GitHub Actions workflow for install, lint, backend tests, frontend build, and smoke checks.
- Docker Compose verification step.
- Versioned release notes.
- Trainer setup checklist.
- Student setup checklist.
- Troubleshooting guide.

Acceptance criteria:

- Pull requests run fast validation.
- Main branch remains runnable.
- The app can be tagged as a classroom release before Day 1.

## Suggested Build Order

1. Add root workspace scripts and setup docs.
2. Scaffold ReactJS + Vite frontend.
3. Scaffold NestJS POS service.
4. Add database schema, migrations, and seed/reset commands.
5. Replace in-memory starter data with database-backed POS services.
6. Scaffold NestJS OMS service.
7. Add POS-to-OMS order creation and Pact contracts.
8. Complete OpenAPI specs for POS and OMS.
9. Build React app shell and login flow.
10. Build product, cart, checkout, order, profile, and admin pages.
11. Integrate WireMock payment, inventory, shipping, and notification flows.
12. Add defect flags with trainer notes.
13. Add CI, Pact verification, and Docker Compose validation.
14. Freeze a classroom release tag.

## Route-Level Development Checklist

| Route | Service Needed | Frontend Needed | Automation Focus |
| --- | --- | --- | --- |
| `/login` | Auth login/logout | Login form, locked-user message | Forms, auth, negative testing. |
| `/home` | Current user | Dashboard cards/nav | Smoke, navigation, roles. |
| `/products` | Product list with query params | Search/filter/sort/pagination | Locators, waits, data assertions. |
| `/products/:id` | Product detail | Detail page and add-to-cart | URL params, state transition. |
| `/cart` | Cart read/update/delete | Cart table and totals | Table assertions, quantity edits. |
| `/checkout` | POS checkout, OMS order create, payment mock | Checkout form and result states | E2E, mocking, contracts, failures. |
| `/orders` | OMS order list/detail through POS API | History and detail view | API chaining and UI validation. |
| `/profile` | Profile read/update | Validation and upload placeholder | Forms and validation. |
| `/admin/products` | Admin CRUD | Product management table/form | Role-based CRUD testing. |
| `/admin/orders` | Admin order list | Filterable order table | Admin filters and data checks. |

## Data Model Draft

### User

- `id`
- `email`
- `passwordHash`
- `role`
- `name`
- `locked`
- `createdAt`
- `updatedAt`

### Product

- `id`
- `name`
- `description`
- `category`
- `price`
- `stock`
- `imageUrl`
- `active`
- `createdAt`
- `updatedAt`

### CartItem

- `id`
- `userId`
- `productId`
- `quantity`
- `createdAt`
- `updatedAt`

### Order

- `id`
- `userId`
- `status`
- `subtotal`
- `tax`
- `shipping`
- `total`
- `paymentStatus`
- `paymentReference`
- `createdAt`
- `updatedAt`

### OrderItem

- `id`
- `orderId`
- `productId`
- `productName`
- `unitPrice`
- `quantity`
- `lineTotal`

## Seed Data Requirements

Minimum users:

- `customer@example.com / Password@123`
- `admin@example.com / Password@123`
- `support@example.com / Password@123`
- `locked@example.com / Password@123`
- `invalid@example.com / Password@123`

Minimum products:

- Accessories category.
- Audio category.
- Workspace category.
- At least one out-of-stock product.
- At least one product with special characters in the name.
- At least one inactive product for admin-only visibility.

Minimum orders:

- One confirmed customer order.
- One pending order.
- One failed-payment order.

## Environment Variables

```env
POS_SERVICE_PORT=4000
OMS_SERVICE_PORT=4010
DATABASE_URL=postgresql://retail:retail@localhost:5432/sdet_retail
JWT_SECRET=
OMS_SERVICE_URL=http://localhost:4010
PAYMENT_SERVICE_URL=http://localhost:8089
NOTIFICATION_SERVICE_URL=http://localhost:8089
BUG_SLOW_PRODUCTS_API=false
BUG_CHECKOUT_RANDOM_FAILURE=false
BUG_MISSING_ALT_TEXT=false
BUG_WRONG_ORDER_TOTAL=false
BUG_UNSTABLE_TOAST=false
BUG_BROKEN_ADMIN_FILTER=false
```

## Documentation To Add

| Document | Purpose |
| --- | --- |
| `docs/setup-guide.md` | Local setup for trainers and students. |
| `docs/trainer-guide.md` | Day-wise trainer notes and demo switches. |
| `docs/api-workflows.md` | API chaining examples for Week 2. |
| `docs/contract-testing.md` | POS-to-OMS Pact and CI contract gate guide. |
| `docs/defect-labs.md` | Seeded defect scenarios and evidence guide. |
| `docs/mock-services.md` | WireMock payment/notification guide. |
| `docs/capstone-brief.md` | Final project instructions and evaluation criteria. |
| `docs/troubleshooting.md` | Common setup and runtime issues. |

## Release Plan

| Release | Scope |
| --- | --- |
| `v0.1-classroom-api` | NestJS POS API, OpenAPI, seed/reset, Docker database. |
| `v0.2-classroom-ui` | Core ReactJS UI for customer flows. |
| `v0.3-oms-contracts` | OMS service, POS-to-OMS Pact contracts, and CI contract gate. |
| `v0.4-admin-mocks` | Admin pages and WireMock service integration. |
| `v0.5-defect-labs` | Seeded defect flags and trainer notes. |
| `v1.0-ust-sdet-training` | Full classroom-ready app with CI, docs, and capstone support. |

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| App becomes too complex for freshers | Keep only one real microservice boundary in v1: POS to OMS. |
| Local setup fails on trainee machines | Provide Docker Compose, npm fallback, and troubleshooting notes. |
| Random defects make classes unstable | Keep all seeded bugs off by default and flag-controlled. |
| UI changes break automation repos | Use semantic UI contracts and stable test IDs only where necessary. |
| API and OpenAPI drift | Add CI validation and update OpenAPI in the same PR as backend changes. |

## Done Criteria For Classroom Use

- `docker compose up` starts frontend, POS service, OMS service, database, and WireMock.
- Seed/reset command restores known data.
- Customer and admin credentials work.
- Core UI workflows are automatable through Playwright and Selenium.
- Core API workflows are automatable through API tests.
- Payment success and failure can be mocked.
- POS-to-OMS Pact contract can be verified.
- Defect flags are documented and default to off.
- OpenAPI spec matches implementation.
- GitHub Actions validates the app.
- Trainer can run the final capstone without external demo sites.
