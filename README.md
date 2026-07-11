# ShopKart Pre-Capstone System Under Test

ShopKart is the provided application for the Week 6 Day 6 pre-capstone build. Participants automate the required scenarios; they do not build or modify this application during the assessment.

The `shopkart` branch is intentionally smaller than the main retail training app. It exposes one deterministic checkout domain across UI, API and SQL so the same business fact can be verified at the correct layer.

## Supplied Surfaces

| Surface | URL |
| --- | --- |
| ShopKart UI | `http://localhost:8080` |
| REST API | `http://localhost:8080/api` |
| Swagger UI | `http://localhost:8080/api-docs` |
| OpenAPI YAML | `http://localhost:8080/openapi.yaml` |

## Participant Prerequisites

- Node.js 20 LTS or newer
- MySQL Server 8.x or PostgreSQL 14+ running locally
- Git and an IDE
- No Docker, Podman, global Gradle or local Allure CLI is required for ShopKart

MySQL and PostgreSQL Testcontainers are used by GitHub Actions to prove the application against fresh disposable databases.

## First-Time Local Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Create a dedicated database user

MySQL:

```sql
CREATE DATABASE IF NOT EXISTS shopkart;
CREATE USER IF NOT EXISTS 'shopkart_user'@'localhost' IDENTIFIED BY '<your-local-password>';
GRANT ALL PRIVILEGES ON shopkart.* TO 'shopkart_user'@'localhost';
FLUSH PRIVILEGES;
```

PostgreSQL (`CREATE DATABASE` must be executed outside a transaction):

```sql
CREATE USER shopkart_user WITH PASSWORD '<your-local-password>';
CREATE DATABASE shopkart OWNER shopkart_user;
```

If the user or database already exists, update the password and ownership:

```sql
ALTER USER shopkart_user WITH PASSWORD '<your-local-password>';
ALTER DATABASE shopkart OWNER TO shopkart_user;
```

`shopkart` is only the recommended example name. Participants may use any
database name supported by their database engine; create that database and set
the same value in `DB_NAME`.

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

- `DB_DIALECT` as `mysql` or `postgresql`
- `DB_PASSWORD`
- `SHOPKART_TOKEN_SECRET` with at least 32 random characters
- `SHOPKART_ALICE_PASSWORD`
- `SHOPKART_BOB_PASSWORD`
- `SHOPKART_CAROL_PASSWORD`

The passwords may contain `@`, `#`, `:` and other special characters because they are separate environment values. Do not insert them into a connection URL. Do not share the populated file.

For PostgreSQL use:

```env
DB_DIALECT=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopkart
DB_USER=shopkart_user
DB_PASSWORD=<your-local-password>
```

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

PostgreSQL returns the same response with `"database":"postgresql"`.

Run the secret-safe API smoke flow in another terminal:

```bash
npm run smoke
```

The smoke script reads the assigned Alice and Bob passwords from the environment and never prints credentials or bearer tokens.

### If Workbench or IntelliJ shows no tables

Run the migration directly:

```bash
npm run db:migrate
```

The verification block prints the configuration source, requested host/port,
actual database server identity, selected database, authenticated user, migration
versions, verified table names and seed counts. It never prints the password.

Copy the exact `mysql -h ...` or `psql -h ...` command printed at the end and
enter the same password used in `.env`.

MySQL checks:

```sql
SELECT DATABASE();
SHOW TABLES;
SELECT COUNT(*) FROM products;
```

PostgreSQL checks:

```sql
SELECT current_database();
\dt
SELECT COUNT(*) FROM products;
```

If this shows the tables but the database UI does not, its connection points to
a different host/port or schema. Update that connection from `Requested target`,
reconnect, and refresh the `shopkart` schema. A successful migration verifies
seven tables, three customers and eight products; it now fails instead of
reporting success when that database state is incomplete.

### If the resolved database differs from the intended one

The diagnostic distinguishes process/IDE variables from the project `.env`.
Process variables have higher priority, so a Windows or IDE value such as
`DB_NAME=sdet_retail` overrides a different value in `.env`. The name itself is
valid; the issue exists only when it is not the database the participant meant
to use.

PowerShell inspection:

```powershell
Get-ChildItem Env: | Where-Object Name -Match '^(DB_|DATABASE_URL$)'
```

Git Bash inspection:

```bash
env | grep -E '^(DB_|DATABASE_URL=)'
```

Remove stale values from the terminal session, remove the same entries from the
IDE run configuration, restart the terminal/IDE, and rerun `npm run db:migrate`.
The `Configuration source` should name the intended source and `Requested
target` should end with the exact `DB_NAME` selected by the participant.

Check the database used by the already-running application separately:

```bash
curl http://localhost:8080/api/health
```

The response includes `databaseTarget` and `processId`. If its target differs
from the migration target, stop that process and run `npm start` again. On
Windows, use `taskkill /PID <processId> /F`. ShopKart now refuses to start with a
clear error when an older process is still occupying port 8080.

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
| `npm run test:ci` | Run API flows against MySQL and PostgreSQL Testcontainers |
| `npm run smoke` | Verify a running ShopKart instance without printing secrets |

CI also runs Gitleaks against the complete Git history. The repository baselines
five inactive fingerprints inherited from the older retail-demo history; every
new finding fails the workflow.

## Repository Layout

```text
backend/                    Express API, dual SQL adapter and tests
database/migration/         MySQL V1 schema and V2 public reference data
database/migration-postgresql/ PostgreSQL V1 schema and V2 public reference data
frontend/                   React + Vite customer UI
scripts/                    Cross-platform start and smoke scripts
docs/shopkart-api.http      Executable API examples
openapi.yaml                Swagger/OpenAPI contract
.github/workflows/          MySQL and PostgreSQL Testcontainers CI proof
```

## Secret Handling Rules

- Never commit `.env`, `.env.local`, another populated `.env.*` file, or `secrets.local.properties`.
- Never place a password in a feature file, page object, API client, test-data builder or report attachment.
- Do not print bearer tokens or authorization headers.
- Use a persona name in scenarios, then resolve its password at runtime.
- Commit examples with blank values or placeholders only.
