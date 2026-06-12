# Architecture Decision: SDET Retail Automation Lab

## Decision

Build the training app with a **focused microservices slice**, not a full production-style microservice platform.

Target architecture:

```text
ReactJS frontend
  |
POS / retail API service
  |
  |-- MySQL
  |-- OMS service
  |-- WireMock external services
```

## Stack

| Area | Decision |
| --- | --- |
| Frontend | ReactJS |
| Frontend tooling | Vite |
| Backend services | NestJS |
| Database | MySQL |
| ORM | Prisma |
| Service virtualisation | WireMock |
| Consumer-driven contracts | Pact |
| Runtime | Docker Compose |

## Why ReactJS With Vite

ReactJS is the UI library students will see and automate. Vite is only the development/build tool.

Vite is preferred because it gives fast startup, simple local setup, and a modern ReactJS project structure. This helps classroom flow because trainees spend less time waiting for tooling and more time practicing automation.

## Why NestJS For Backend

NestJS is preferred over plain Express for the full app because it gives:

- Clear module boundaries for auth, catalog, cart, checkout, orders, and admin.
- DTOs and validation patterns.
- Swagger/OpenAPI support.
- A clean structure for POS and OMS services.
- Better enterprise-style organization for an MNC training context.

The current Express code is only a small starter API so automation repos have an immediate runnable target. It should be migrated into NestJS as the app matures.

## Microservices Scope

The course planner includes Week 4 microservices and contract testing. The app should therefore include one real service boundary:

```text
POS / retail API -> OMS service
```

This supports:

- WireMock service virtualisation.
- Pact consumer-driven contracts.
- CI contract gates.
- Breaking-change demonstrations.
- Week 7 integrated capstone with UI, API, DB, contract, and resilience evidence.

The app should not start with separate auth, catalog, cart, order, payment, inventory, and notification services. That would add setup and debugging burden for freshers before they have mastered the testing objectives.

## External Services

Use WireMock for downstream dependencies:

- Payment.
- Inventory.
- Shipping.
- Notification.

This gives trainees controlled failure modes without requiring many real services.

## Service Naming

Use these names consistently:

- `frontend`: ReactJS UI.
- `pos-service`: customer-facing retail API and checkout orchestration.
- `oms-service`: order management service.
- `mysql`: persistent database.
- `wiremock`: external service virtualisation.
- `pact-broker`: optional local Pact broker for Week 4 and Week 7.

## Teaching Rationale

This architecture gives enough microservice realism to satisfy the planner while keeping the first three weeks approachable:

- Week 1: UI automation against ReactJS screens.
- Week 2: API automation against POS APIs.
- Week 3: Selenium Java against the same UI.
- Week 4: POS-to-OMS contracts and WireMock dependencies.
- Week 5: Debugging, resilience, and controlled defects.
- Week 6: Framework maturity and CI.
- Week 7: Integrated capstone.
