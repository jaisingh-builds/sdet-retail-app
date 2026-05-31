# UST Global SDET Training Project Plan

## Program Goal

Use one controlled training application as the backbone for the 42-day SDET program, supported by separate automation repositories for Playwright TypeScript, Selenium Java, and API/contract testing.

The main application is named **SDET Retail Automation Lab**. It gives trainees one stable business domain for UI, API, database, mocking, debugging, CI, and capstone work.

## Repository Model

| Repository | Purpose |
| --- | --- |
| `sdet-retail-app` | Main starter application with frontend, backend, seed data, OpenAPI contract, Docker Compose, and classroom notes. |
| `sdet-playwright-ts` | Playwright TypeScript UI automation framework for Week 1 and later framework-maturity topics. |
| `sdet-selenium-java` | Selenium Java framework for Week 3 using the same retail workflows. |
| `sdet-api-contract-tests` | API, WireMock, and contract-test starter workspace for Weeks 2 and 4. |

## Why A Controlled App

Public demo apps are useful for practice, but they should not be the backbone of an MNC training program. They can change, go down, throttle users, restrict test data, and prevent database or service-level demonstrations.

The controlled app gives the trainer:

- Stable login, product, cart, checkout, order, profile, and admin workflows.
- Known credentials and resettable seed data.
- APIs with an OpenAPI contract.
- Mockable payment and notification services.
- Intentional defects controlled by feature flags.
- Reliable CI, reports, logs, screenshots, traces, and debugging exercises.

## Application Scope

### Pages

| Page | Training Use |
| --- | --- |
| `/login` | Authentication, negative login, sessions, cookies. |
| `/home` | Navigation, smoke tests, role-aware UI. |
| `/products` | Locators, search, filters, pagination, data assertions. |
| `/products/:id` | Product detail assertions and add-to-cart flow. |
| `/cart` | Cart updates, totals, state validation. |
| `/checkout` | End-to-end checkout and payment mock behavior. |
| `/orders` | Order history and API chaining. |
| `/profile` | Form validation and file-upload practice. |
| `/admin/products` | Admin CRUD testing. |
| `/admin/orders` | Role-based admin workflow validation. |

### APIs

| Method | Endpoint | Training Use |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Token handling and negative auth tests. |
| `POST` | `/api/auth/logout` | Session cleanup. |
| `GET` | `/api/products` | Query params, schema assertions, pagination. |
| `GET` | `/api/products/{id}` | Path params and not-found tests. |
| `POST` | `/api/cart/items` | Request body validation and chaining. |
| `GET` | `/api/cart` | State verification. |
| `POST` | `/api/orders` | Checkout flow and downstream mock behavior. |
| `GET` | `/api/orders/{id}` | Order lookup and DB validation. |
| `GET` | `/api/users/me` | Authenticated profile read. |
| `PUT` | `/api/users/me` | Form/API validation. |
| `POST` | `/api/admin/products` | Admin create flow. |
| `PUT` | `/api/admin/products/{id}` | Admin update flow. |
| `DELETE` | `/api/admin/products/{id}` | Admin delete flow. |

## Seed Users

| Role | Username | Password | Notes |
| --- | --- | --- | --- |
| Customer | `customer@example.com` | `Password@123` | Main trainee account. |
| Admin | `admin@example.com` | `Password@123` | Product and order administration. |
| Support | `support@example.com` | `Password@123` | Support workflow extension. |
| Locked | `locked@example.com` | `Password@123` | Negative login and account-state tests. |
| Invalid | `invalid@example.com` | `Password@123` | Negative login practice. |

## Seeded Defect Flags

Use feature flags so defects can be turned on only for selected days.

```env
BUG_SLOW_PRODUCTS_API=false
BUG_CHECKOUT_RANDOM_FAILURE=false
BUG_MISSING_ALT_TEXT=false
BUG_WRONG_ORDER_TOTAL=false
BUG_UNSTABLE_TOAST=false
BUG_BROKEN_ADMIN_FILTER=false
```

## 42-Day Course Mapping

### Week 1: Playwright UI Foundation

Use login, home, products, search, filters, cart, and accessibility basics.

Outcomes:

- Launch app locally.
- Write stable locators using role, label, text, and test id where appropriate.
- Use assertions, screenshots, traces, and reports.
- Understand why brittle CSS/XPath selectors fail.

### Week 2: API Automation

Use auth, products, cart, orders, and profile APIs.

Outcomes:

- Validate status codes and JSON bodies.
- Chain requests with auth tokens.
- Validate schemas.
- Cover positive and negative API paths.

### Week 3: Selenium Java

Repeat the same UI flows from Week 1 using Selenium Java.

Outcomes:

- Compare Playwright and Selenium approaches.
- Use Page Object Model.
- Practice explicit waits and browser configuration.
- Build reusable Java test utilities.

### Week 4: Mocking And Contract Testing

Use checkout, payment mock, notification mock, WireMock, and Pact-style examples.

Outcomes:

- Replace downstream services with mocks.
- Test payment failures and delays.
- Understand consumer-provider contracts.
- Validate API expectations before integration.

### Week 5: Debugging And Reliability

Turn on controlled defects.

Outcomes:

- Analyze traces, screenshots, videos, logs, retries, and flaky behavior.
- File defects with evidence.
- Distinguish product bugs, test bugs, data bugs, and environment bugs.

### Week 6: Framework Maturity

Strengthen all automation repos.

Outcomes:

- Add reusable fixtures, page objects, API clients, and test-data builders.
- Add DB reset and Testcontainers discussion/practice.
- Run tests in CI with reports and parallel execution.

### Week 7: Final Capstone

Use the same retail app for a complete enterprise-style scenario.

Mandatory flow:

1. Register or log in.
2. Search product.
3. Add product to cart.
4. Checkout.
5. Validate order through API.
6. Validate DB record or seed-data state.
7. Mock payment failure.
8. Generate test report.
9. Run in CI.
10. Explain defects and evidence.

Optional extensions:

- Accessibility scan.
- Security smoke check.
- Performance smoke check.
- AI-generated test review.
- Locator resilience comparison.

## Trainer Execution Plan

| Phase | Duration | Deliverable |
| --- | --- | --- |
| Setup | Day 0 | Share GitHub repos, setup guide, credentials, and tool checklist. |
| Foundation | Days 1-10 | UI and API basics running against controlled app. |
| Comparison | Days 11-15 | Selenium Java implementation of familiar retail flows. |
| Integration | Days 16-24 | Mocking, contract testing, and service-level validation. |
| Reliability | Days 25-32 | Debugging, flaky tests, reporting, and defect triage. |
| Enterprise Practice | Days 33-37 | Framework structure, CI, data reset, and parallel execution. |
| Capstone | Days 38-42 | Team project, demo, evaluation, and retrospective. |

## Definition Of Done

- Application starts locally using Docker Compose or npm scripts.
- Seed users and products are documented.
- OpenAPI spec is available in the app repository.
- Each test repository has a working starter test and README.
- Backup lab list is available for outages or extra practice.
- Final capstone can be performed without relying on external demo sites.
