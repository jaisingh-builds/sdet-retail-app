# Project Plan Validation

This snapshot compares the current classroom app with `UST_SDET_Project_Plan.md` and
`docs/development-plan.md`.

## Covered Well

| Area | Current coverage |
| --- | --- |
| Login | Positive, invalid, locked-user, delayed button, session storage, role display. |
| Home | Smoke target, route navigation, signed-in state, module dashboard. |
| Catalog | Search, category filter, sorting, pagination, inventory signals, product cards. |
| Product detail | URL params, size/color/quantity/fulfilment controls, iframe promo widget, add-to-cart. |
| Cart | API-backed cart creation/read/delete, cart lines, totals, shipping method, confirmation dialog. |
| Checkout | API-backed order creation, address, slot, payment method, coupon, confirmation. |
| Orders | API-backed order retrieval, status filter, order value summary, order table, selected-order detail panel. |
| Profile | Authenticated `/api/users/me` load and save, validation, upload locator practice. |
| Admin products | Create, filter, restock, mark down, delete, inventory table. |
| Admin orders | Status and channel filters, fulfilment queue table. |
| Week 1 labs | Sync, navigation, iframe, dialog, accessibility violation, debugging/stability lab. |

## Covered Partially

| Plan expectation | Current state | Next meaningful step |
| --- | --- | --- |
| API persistence/reset | Express in-memory service now stores cart and order data for the current process. | Add reset endpoint/script before broader API labs. |
| OpenAPI completeness | Core endpoints are documented, but schemas are light. | Add request/response schemas and examples. |
| Admin CRUD API parity | Backend supports create/update/delete; frontend now demonstrates equivalent actions locally. | Wire frontend admin actions to API after auth/role flows settle. |
| Checkout downstream behavior | UI has deterministic order confirmation; backend has defect flags. | Connect checkout to payment WireMock mappings. |
| Feature flags | Flags exist in backend and docs. | Add trainer notes per flag with symptoms and evidence. |

## Still Planned

| Milestone | Status |
| --- | --- |
| NestJS POS service | Planned; current backend remains Express classroom starter. |
| MySQL + Prisma | Planned. |
| OMS microservice slice | Planned for contract-testing phase. |
| Pact POS-to-OMS tests | Planned for Week 4. |
| WireMock payment, inventory, shipping, notification integrations | Starter mappings exist; full app integration pending. |
| CI release workflow | Planned after app and repo structure stabilise. |

## Validation Summary

The current app is now strong enough for Week 1 UI automation and usable as the same domain for
Week 2 API chaining. It should not yet be presented as the finished enterprise microservice target;
it is the controlled classroom starter that leads into the planned NestJS, MySQL, OMS,
WireMock, and Pact milestones.
