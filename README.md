# SDET Retail Automation Lab

Starter application for the UST Global 42-day SDET training program.

This repo is the controlled classroom app used for UI automation, API automation, mocking, debugging, CI, and capstone work.

## What Is Included

- `backend/`: Node.js and Express starter API.
- `frontend/`: React placeholder structure for the classroom UI.
- `seed-data/`: Users and products for repeatable labs.
- `openapi.yaml`: API contract for testing and documentation.
- `wiremock/`: Mock-service starter mappings.
- `docker-compose.yml`: Local service orchestration starter.

## Seed Credentials

| Role | Username | Password |
| --- | --- | --- |
| Customer | `customer@example.com` | `Password@123` |
| Admin | `admin@example.com` | `Password@123` |
| Support | `support@example.com` | `Password@123` |
| Locked | `locked@example.com` | `Password@123` |

## Local Backend

```bash
cd backend
npm install
npm start
```

Backend health check:

```bash
curl http://localhost:4000/api/health
```

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
