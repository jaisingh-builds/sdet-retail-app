# ShopKart Pre-Capstone System Under Test

ShopKart is the provided application for the Week 6 Day 6 pre-capstone build. Participants automate the required scenarios; they do not build or modify this application during the assessment.

The `shopkart` branch is intentionally smaller than the main retail training app. It exposes one deterministic checkout domain across UI, API and MySQL so the same business fact can be verified at the correct layer.

## Supplied Surfaces

| Surface | URL |
| --- | --- |
| ShopKart UI | `http://localhost:8080` |
| REST API | `http://localhost:8080/api` |
| Swagger UI | `http://localhost:8080/api-docs` |
| OpenAPI YAML | `http://localhost:8080/openapi.yaml` |

## Participant Prerequisites

- Node.js 20 LTS or newer
- MySQL Server 8.x running locally
- Git and an IDE
- No Docker, Podman, global Gradle or local Allure CLI is required for ShopKart

MySQL Testcontainers are used by GitHub Actions to prove the application against a fresh disposable database.

## First-Time Local Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Create a dedicated MySQL user

Run this in the MySQL client using an administrative account:

```sql
CREATE DATABASE IF NOT EXISTS shopkart;
CREATE USER IF NOT EXISTS 'shopkart_user'@'localhost' IDENTIFIED BY '<your-local-password>';
GRANT ALL PRIVILEGES ON shopkart.* TO 'shopkart_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Create the ignored environment file

Git Bash/macOS/Linux:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Set these local-only values in `.env`:

- `DB_PASSWORD`
- `SHOPKART_TOKEN_SECRET` with at least 32 random characters
- `SHOPKART_ALICE_PASSWORD`
- `SHOPKART_BOB_PASSWORD`
- `SHOPKART_CAROL_PASSWORD`

The passwords may contain `@`, `#`, `:` and other special characters because they are separate environment values. Do not insert them into a connection URL. Do not share the populated file.

When both forms are present, a complete `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD` set takes precedence over `DATABASE_URL`. This lets
IntelliJ or shell configuration override a stale ignored `.env` safely.

Verify that Git ignores it:

```bash
git check-ignore .env
```

### 4. Migrate and start

Git Bash/macOS/Linux:

```bash
./scripts/shopkart-start.sh
```

PowerShell:

```powershell
.\scripts\shopkart-start.ps1
```

The scripts apply `V1__schema.sql` and `V2__seed.sql`, derive password hashes from the environment, build the React UI and start ShopKart on port `8080`.

## Verification

```bash
curl http://localhost:8080/api/health
curl "http://localhost:8080/api/products?q=bag"
```

Expected health response:

```json
{"status":"UP","service":"shopkart","database":"mysql"}
```

Run the secret-safe API smoke flow in another terminal:

```bash
npm run smoke
```

The smoke script reads the assigned Alice and Bob passwords from the environment and never prints credentials or bearer tokens.

## Seeded Public Data

| Persona | Login identifier | Purpose |
| --- | --- | --- |
| Alice | `alice@shopkart.test` | Primary checkout owner |
| Bob | `bob@shopkart.test` | Object-level authorization negative |
| Carol | `carol@shopkart.test` | Additional isolated test persona |

Passwords are not in this repository. The migration runner derives their hashes from local environment or CI runtime values.

| SKU | Product | Price in paise | Stock | Scenario use |
| --- | --- | ---: | ---: | --- |
| `SKU-BAG` | Metro Carryall | 49900 | 10 | Flagship checkout |
| `SKU-PEN` | Precision Pen Set | 9900 | 100 | Multi-line totals |
| `SKU-MUG` | Studio Ceramic Mug | 24900 | 3 | Low stock |
| `SKU-CAP` | Everyday Cap | 39900 | 0 | Out-of-stock `409` |
| `SKU-TEE` | Training Tee | 59900 | 25 | General product |
| `SKU-KEY` | Utility Key Organiser | 14900 | 50 | General product |
| `SKU-BTL` | Insulated Bottle | 34900 | 18 | General product |
| `SKU-LMP` | Focus Desk Lamp | 79900 | 8 | General product |

## Required Capstone Behavior

- Product search is public and filters by name, SKU or category.
- Cart and order routes require a bearer token.
- Missing or invalid authentication returns `401`.
- An authenticated customer reading another customer's cart or order receives `403`.
- Missing resources receive `404`.
- Out-of-stock, empty-cart, duplicate checkout and invalid cancellation receive `409`.
- All money is stored and calculated as integer paise.
- Checkout writes the order, order items and cart state in one database transaction.
- One cart can create exactly one order.

See [docs/shopkart-scenario-contract.md](docs/shopkart-scenario-contract.md) for the complete assessment-facing contract.
The environment-specific changes from the original brief are recorded in
[docs/shopkart-implementation-decisions.md](docs/shopkart-implementation-decisions.md).

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run db:migrate` | Apply missing migrations and refresh secret-derived hashes |
| `npm run db:reset` | Clear carts/orders and restore a clean scenario baseline |
| `npm run build` | Build the production React UI |
| `npm start` | Build and serve UI + API on port 8080 |
| `npm test` | Run unit checks and build the frontend |
| `npm run test:ci` | Run the full API flow with a MySQL Testcontainer |
| `npm run smoke` | Verify a running ShopKart instance without printing secrets |

CI also runs Gitleaks against the complete Git history. The repository baselines
five inactive fingerprints inherited from the older retail-demo history; every
new finding fails the workflow.

## Repository Layout

```text
backend/                    Express API, MySQL repository and tests
database/migration/         V1 schema and V2 public reference data
frontend/                   React + Vite customer UI
scripts/                    Cross-platform start and smoke scripts
docs/shopkart-api.http      Executable API examples
openapi.yaml                Swagger/OpenAPI contract
.github/workflows/          MySQL Testcontainers CI proof
```

## Secret Handling Rules

- Never commit `.env`, `.env.local`, another populated `.env.*` file, or `secrets.local.properties`.
- Never place a password in a feature file, page object, API client, test-data builder or report attachment.
- Do not print bearer tokens or authorization headers.
- Use a persona name in scenarios, then resolve its password at runtime.
- Commit examples with blank values or placeholders only.
