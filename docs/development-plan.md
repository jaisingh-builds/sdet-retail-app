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
├── frontend/              React UI for trainee automation
├── backend/               Node.js/Express API
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
| Frontend | React + Vite | Fast local startup and easy classroom debugging. |
| Backend | Node.js + Express | Simple API surface and familiar JavaScript ecosystem. |
| Database | PostgreSQL | Enterprise-relevant DB validation practice. |
| ORM/query | Prisma or Knex | Repeatable schema and seed workflows. |
| Mock services | WireMock | Clear request/response mapping for payment and notification labs. |
| API docs | OpenAPI/Swagger UI | Supports API automation and contract discussion. |
| Local runtime | Docker Compose | Repeatable setup for trainees. |
| CI | GitHub Actions | Public repo-friendly automation pipeline. |

## Development Milestones

### Milestone 0: Baseline Stabilization

Goal: Convert the starter repo into a dependable base.

Deliverables:

- Confirm repo scripts for backend start, frontend start, tests, lint, and Docker Compose.
- Add shared environment documentation.
- Add `.env.example` coverage for all services.
- Add health checks for API, database, and WireMock.
- Add root README setup flow for trainers and students.

Acceptance criteria:

- A new trainee can clone the repo and run the app locally.
- `docker compose up` starts all required services.
- Health endpoints are documented and return predictable responses.

### Milestone 1: Backend Core API

Goal: Implement a proper API with persistent data and resettable state.

Deliverables:

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
- Seed data can be reset with one command.
- Customer, admin, support, locked, and invalid-user scenarios are covered.
- API responses are stable enough for training assertions.

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

### Milestone 3: Mock Services

Goal: Add downstream service behavior for mocking and contract-testing labs.

Deliverables:

- WireMock mapping for payment success.
- WireMock mapping for payment decline.
- WireMock mapping for payment timeout.
- WireMock mapping for shipping estimate.
- WireMock mapping for notification accepted/failure.
- Backend integration points for payment, shipping, and notification mocks.
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

- Complete `openapi.yaml`.
- Swagger UI route or documented OpenAPI viewer flow.
- Example API workflow collection in docs.
- JSON schema examples for products, cart, orders, and users.
- Error response format standardization.
- Contract-test scenarios for checkout/payment expectations.

Acceptance criteria:

- OpenAPI spec matches implemented backend routes.
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
2. Add database schema, migrations, and seed/reset commands.
3. Replace in-memory backend data with database-backed services.
4. Complete OpenAPI spec for the backend.
5. Build React app shell and login flow.
6. Build product, cart, checkout, order, profile, and admin pages.
7. Integrate WireMock payment and notification flows.
8. Add defect flags with trainer notes.
9. Add CI and Docker Compose validation.
10. Freeze a classroom release tag.

## Route-Level Development Checklist

| Route | Backend Needed | Frontend Needed | Automation Focus |
| --- | --- | --- | --- |
| `/login` | Auth login/logout | Login form, locked-user message | Forms, auth, negative testing. |
| `/home` | Current user | Dashboard cards/nav | Smoke, navigation, roles. |
| `/products` | Product list with query params | Search/filter/sort/pagination | Locators, waits, data assertions. |
| `/products/:id` | Product detail | Detail page and add-to-cart | URL params, state transition. |
| `/cart` | Cart read/update/delete | Cart table and totals | Table assertions, quantity edits. |
| `/checkout` | Order create, payment mock | Checkout form and result states | E2E, mocking, failures. |
| `/orders` | Order list/detail | History and detail view | API chaining and UI validation. |
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
PORT=4000
DATABASE_URL=postgresql://retail:retail@localhost:5432/sdet_retail
JWT_SECRET=classroom-secret
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
| `docs/defect-labs.md` | Seeded defect scenarios and evidence guide. |
| `docs/mock-services.md` | WireMock payment/notification guide. |
| `docs/capstone-brief.md` | Final project instructions and evaluation criteria. |
| `docs/troubleshooting.md` | Common setup and runtime issues. |

## Release Plan

| Release | Scope |
| --- | --- |
| `v0.1-classroom-api` | Backend API, OpenAPI, seed/reset, Docker database. |
| `v0.2-classroom-ui` | Core React UI for customer flows. |
| `v0.3-admin-mocks` | Admin pages and WireMock service integration. |
| `v0.4-defect-labs` | Seeded defect flags and trainer notes. |
| `v1.0-ust-sdet-training` | Full classroom-ready app with CI, docs, and capstone support. |

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| App becomes too complex for freshers | Keep domain small and hide backend complexity behind docs. |
| Local setup fails on trainee machines | Provide Docker Compose, npm fallback, and troubleshooting notes. |
| Random defects make classes unstable | Keep all seeded bugs off by default and flag-controlled. |
| UI changes break automation repos | Use semantic UI contracts and stable test IDs only where necessary. |
| API and OpenAPI drift | Add CI validation and update OpenAPI in the same PR as backend changes. |

## Done Criteria For Classroom Use

- `docker compose up` starts frontend, backend, database, and WireMock.
- Seed/reset command restores known data.
- Customer and admin credentials work.
- Core UI workflows are automatable through Playwright and Selenium.
- Core API workflows are automatable through API tests.
- Payment success and failure can be mocked.
- Defect flags are documented and default to off.
- OpenAPI spec matches implementation.
- GitHub Actions validates the app.
- Trainer can run the final capstone without external demo sites.
