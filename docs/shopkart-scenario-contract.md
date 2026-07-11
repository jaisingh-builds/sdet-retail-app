# ShopKart Assessment Contract

This document defines the behavior the participant automation may rely on. It is not a solution to the six assessment scenarios.

## Scenario Matrix

| Scenario | UI | API | DB | Expected signal |
| --- | --- | --- | --- | --- |
| Product search | Yes | Yes | No | Matching names/SKUs only |
| Cart totals | No | Yes | Yes | Sum of `qty * pricePaise` |
| Checkout E2E | Yes | Yes | Yes | One `PLACED` order |
| Order access | No | Yes | No | Owner `200`, another customer `403` |
| Cancel rules | No | Yes | Yes | First cancel `200`, second cancel `409` |
| Out of stock | No | Yes | No | `SKU-CAP` add returns `409` |

## UI Routes and Stable DOM Contract

| Route | Stable element |
| --- | --- |
| `/login` | `input[name='email']`, `input[name='password']`, button text `Sign in` |
| `/` | Product `div` class contains `product`; each card contains its visible product name and an `Add to cart` button |
| `/product/{sku}` | Product heading, quantity input and button text `Add to cart` |
| `/cart` | `tr.cart-line`; SKU cell; `.line-total`; `[data-role='cart-total']`; button text `Checkout` |
| `/checkout` | `textarea[name='address']`; button text `Place order` |
| `/orders/{id}` | `[data-field='order-status']`; `[data-field='order-total']` |

Relative, parameterized XPath can be built from these stable semantics. Absolute paths and row indexes are intentionally unnecessary.

## API Contract

| Method and path | Success | Required negative |
| --- | --- | --- |
| `POST /api/auth/login` | `200` token and customer | `401` wrong credentials |
| `GET /api/products?q=` | `200` array | `400` query over 80 chars |
| `POST /api/carts` | `201 OPEN` | `401` missing token |
| `POST /api/carts/{id}/items` | `200` cart and total | `403`, `404`, `409` |
| `GET /api/carts/{id}` | `200` owned cart | `403`, `404` |
| `POST /api/orders` | `201 PLACED` | `403`, `409` |
| `GET /api/orders/{id}` | `200` owned order | `403`, `404` |
| `POST /api/orders/{id}/cancel` | `200 CANCELLED` | `403`, `409` |

The live Swagger UI at `/api-docs` and `openapi.yaml` are authoritative for request and response schemas.

## Database Contract

The participant may query these tables read-only:

- `customers`
- `products`
- `carts`
- `cart_items`
- `orders`
- `order_items`

For the flagship checkout, the DB proof is:

```sql
SELECT COUNT(*)
FROM orders
WHERE id = ?
  AND customer_id = ?
  AND status = 'PLACED'
  AND total_paise = ?;
```

The expected count is exactly `1`. Tests must not update application rows directly.

## Isolation and Reset

- Local development uses the participant's dedicated `shopkart` MySQL database.
- `npm run db:reset` removes carts and orders while preserving public reference data.
- CI uses a new MySQL Testcontainer and applies both migrations before the test flow.
- Tests must build their own cart/order data and must not assume reusable order IDs.
